'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import moment from 'moment'
import { FiLogOut, FiMonitor, FiRefreshCw, FiSmartphone } from 'react-icons/fi'
import {
    listMySessions,
    revokeSession,
    type AuthSessionItem,
} from '../../../app/actions/auth/sessions'
import { createClient } from '../../../lib/supabase/client'
import { useAuthModalStore } from '../../../hooks/useAuthModalStore'
import { useSettingsStore } from '../../../hooks/useSettingsStore'
import { useWalletStore } from '../../../hooks/useWalletStore'

function formatRelative(iso: string | null): string {
    if (!iso) return 'Unknown'
    return moment(iso).fromNow()
}

function isMobileUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false
    return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
}

export default function SessionsTab() {
    const router = useRouter()
    const openAuthModal = useAuthModalStore((s) => s.open)

    const [sessions, setSessions] = useState<AuthSessionItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const [isSigningOutOthers, setIsSigningOutOthers] = useState(false)
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

    const loadSessions = useCallback(async () => {
        setIsLoading(true)
        setError('')
        const result = await listMySessions()
        if (result.error) {
            setError(result.error)
            setSessions([])
        } else {
            setSessions(result.sessions ?? [])
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        loadSessions()
    }, [loadSessions])

    const handleLocalLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut({ scope: 'local' })
        useWalletStore.getState().clearWallets()
        useSettingsStore.getState().closeSettings()
        router.refresh()
        openAuthModal()
    }

    const handleRevoke = async (session: AuthSessionItem) => {
        if (busyId || isSigningOutOthers) return

        setBusyId(session.id)
        setError('')
        setSuccessMessage('')

        const result = await revokeSession(session.id)

        if (result.error) {
            setError(result.error)
            setBusyId(null)
            setConfirmRevokeId(null)
            return
        }

        if (result.revokedSelf) {
            await handleLocalLogout()
            return
        }

        setSessions((prev) => prev.filter((s) => s.id !== session.id))
        setSuccessMessage('Session signed out')
        setConfirmRevokeId(null)
        setBusyId(null)
    }

    const handleSignOutOthers = async () => {
        if (isSigningOutOthers || busyId) return

        setIsSigningOutOthers(true)
        setError('')
        setSuccessMessage('')

        try {
            const supabase = createClient()
            const { error: signOutError } = await supabase.auth.signOut({
                scope: 'others',
            })

            if (signOutError) {
                throw signOutError
            }

            await loadSessions()
            setSuccessMessage('Signed out of all other devices')
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to sign out other sessions'
            setError(message)
        } finally {
            setIsSigningOutOthers(false)
        }
    }

    const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-medium text-zinc-100">Sessions</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Devices signed into your account. Revoking a session logs you out of that device.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadSessions()}
                    disabled={isLoading || isSigningOutOthers || !!busyId}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title="Refresh"
                    aria-label="Refresh sessions"
                >
                    <FiRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-medium text-zinc-200">Active sessions</h3>
                        <p className="text-xs text-zinc-500">
                            Sign out any device you no longer recognize.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSignOutOthers}
                        disabled={
                            isLoading ||
                            isSigningOutOthers ||
                            !!busyId ||
                            otherSessionsCount === 0
                        }
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-zinc-200 hover:bg-white/10 hover:text-zinc-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                        <FiLogOut size={13} />
                        {isSigningOutOthers
                            ? 'Signing out…'
                            : `Sign out other devices${otherSessionsCount > 0 ? ` (${otherSessionsCount})` : ''}`}
                    </button>
                </div>

                {isLoading && (
                    <div className="text-xs text-zinc-500 animate-pulse py-6">
                        Loading sessions…
                    </div>
                )}

                {!isLoading && sessions.length === 0 && !error && (
                    <div className="text-xs text-zinc-500 py-6 rounded-2xl border border-white/5 bg-[#1c1c1f]/30 px-4">
                        No active sessions found.
                    </div>
                )}

                {!isLoading && sessions.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {sessions.map((session) => {
                            const Icon = isMobileUserAgent(session.userAgent)
                                ? FiSmartphone
                                : FiMonitor
                            const confirming = confirmRevokeId === session.id
                            const busy = busyId === session.id

                            return (
                                <div
                                    key={session.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${session.isCurrent
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : 'bg-[#1c1c1f]/30 border-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${session.isCurrent
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-white/5 text-zinc-400'
                                                }`}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-zinc-200 truncate">
                                                    {session.deviceLabel}
                                                </span>
                                                {session.isCurrent && (
                                                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                                        This device
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-zinc-500">
                                                Last active{' '}
                                                {formatRelative(
                                                    session.updatedAt ?? session.createdAt
                                                )}
                                                {session.ip ? ` · ${session.ip}` : ''}
                                            </span>
                                            <span className="text-[11px] text-zinc-600">
                                                Signed in {formatRelative(session.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 sm:pl-2">
                                        {confirming ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmRevokeId(null)}
                                                    disabled={busy}
                                                    className="px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(session)}
                                                    disabled={busy}
                                                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    {busy
                                                        ? 'Signing out…'
                                                        : session.isCurrent
                                                            ? 'Sign out here'
                                                            : 'Confirm'}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmRevokeId(session.id)}
                                                disabled={!!busyId || isSigningOutOthers}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-400/90 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-40"
                                            >
                                                <FiLogOut size={12} />
                                                {session.isCurrent ? 'Sign out' : 'Revoke'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {successMessage && !isLoading && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl">
                        {successMessage}
                    </div>
                )}

                {error && !isLoading && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl">
                        {error}
                    </div>
                )}
            </div>
        </div>
    )
}
