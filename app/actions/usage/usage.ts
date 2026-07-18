'use server'

import { createClient } from '@/lib/supabase/server'
import { checkLlmQuota, type QuotaCheckResult } from '@/lib/usage/checkQuota'
import {
    getChatTokenUsage,
    type ChatTokenUsage,
} from '@/lib/usage/getChatTokenUsage'
import { getUsageSummary, type UsageSummary } from '@/lib/usage/getUsageSummary'
import { resolveTimeZone } from '@/lib/usage/day'

async function requireUserId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return user.id
}

export async function checkMyUsageQuota(timeZone?: string | null): Promise<QuotaCheckResult> {
    const userId = await requireUserId()
    return checkLlmQuota(userId, resolveTimeZone(timeZone))
}

export async function getMyUsageSummary(timeZone?: string | null): Promise<UsageSummary> {
    const userId = await requireUserId()
    return getUsageSummary(userId, resolveTimeZone(timeZone))
}

export async function getChatTokenUsageAction(chatId: string): Promise<ChatTokenUsage> {
    const userId = await requireUserId()
    if (!chatId?.trim()) {
        return { totalTokens: 0 }
    }
    return getChatTokenUsage(userId, chatId)
}
