'use server'

import { AuthSessionItem } from '@/types'
import { createClient } from '../../../lib/supabase/server'

type RpcSessionRow = {
    id: string
    created_at: string
    updated_at: string | null
    user_agent: string | null
    ip: string | null
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    )
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
    try {
        const parts = accessToken.split('.')
        if (parts.length < 2) return null
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        const json =
            typeof atob === 'function'
                ? atob(padded)
                : Buffer.from(padded, 'base64').toString('utf8')
        return JSON.parse(json) as Record<string, unknown>
    } catch {
        return null
    }
}

function deviceLabelFromUserAgent(userAgent: string | null): string {
    if (!userAgent?.trim()) return 'Unknown device'

    const ua = userAgent

    let browser = 'Browser'
    if (/Edg\//i.test(ua)) browser = 'Edge'
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome'
    else if (/Firefox\//i.test(ua)) browser = 'Firefox'
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari'

    let os = 'Unknown OS'
    if (/Windows NT/i.test(ua)) os = 'Windows'
    else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
    else if (/Android/i.test(ua)) os = 'Android'
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
    else if (/Linux/i.test(ua)) os = 'Linux'
    else if (/CrOS/i.test(ua)) os = 'ChromeOS'

    return `${browser} on ${os}`
}

async function requireAuth() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    return { supabase, user }
}

async function getCurrentSessionId(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) return null

    const payload = decodeJwtPayload(session.access_token)
    const sessionId = payload?.session_id
    return typeof sessionId === 'string' ? sessionId : null
}

export async function listMySessions(): Promise<{
    sessions?: AuthSessionItem[]
    error?: string
}> {
    try {
        const { supabase } = await requireAuth()
        const currentSessionId = await getCurrentSessionId(supabase)

        const { data, error } = await supabase.rpc('list_my_sessions')

        if (error) {
            return {
                error:
                    error.message.includes('function') || error.code === 'PGRST202'
                        ? 'Sessions API is not set up yet. Run the list_my_sessions SQL function in Supabase.'
                        : error.message,
            }
        }

        const rows = (data ?? []) as RpcSessionRow[]
        const sessions: AuthSessionItem[] = rows.map((row) => ({
            id: row.id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userAgent: row.user_agent,
            ip: row.ip,
            isCurrent: currentSessionId != null && row.id === currentSessionId,
            deviceLabel: deviceLabelFromUserAgent(row.user_agent),
        }))

        sessions.sort((a, b) => {
            if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
            const aTime = new Date(a.updatedAt ?? a.createdAt).getTime()
            const bTime = new Date(b.updatedAt ?? b.createdAt).getTime()
            return bTime - aTime
        })

        return { sessions }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load sessions'
        return { error: message }
    }
}

export async function revokeSession(sessionId: string): Promise<{
    success?: boolean
    revokedSelf?: boolean
    error?: string
}> {
    try {
        if (!isUuid(sessionId)) {
            return { error: 'Invalid session id' }
        }

        const { supabase } = await requireAuth()
        const currentSessionId = await getCurrentSessionId(supabase)

        const { data, error } = await supabase.rpc('revoke_my_session', {
            p_session_id: sessionId,
        })

        if (error) {
            return {
                error:
                    error.message.includes('function') || error.code === 'PGRST202'
                        ? 'Sessions API is not set up yet. Run the revoke_my_session SQL function in Supabase.'
                        : error.message,
            }
        }

        if (data !== true) {
            return { error: 'Session not found or already revoked' }
        }

        return {
            success: true,
            revokedSelf: currentSessionId != null && currentSessionId === sessionId,
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to revoke session'
        return { error: message }
    }
}
