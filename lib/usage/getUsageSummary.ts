import db from "@/lib/db"
import { checkLlmQuota } from "@/lib/usage/checkQuota"
import { dayKeyInTimeZone, daysAgoInTimeZone } from "@/lib/usage/day"

import { type UsageSummary } from "@/types"

export async function getUsageSummary(
    userId: string,
    timeZone?: string | null
): Promise<UsageSummary> {
    const uid = userId.trim()
    const day = dayKeyInTimeZone(new Date(), timeZone)
    const weekStart = daysAgoInTimeZone(6, timeZone)

    const [todayRow, weekRows, modelGroups, quota] = await Promise.all([
        db.userUsageDaily.findUnique({
            where: { userId_day: { userId: uid, day } },
        }),
        db.userUsageDaily.findMany({
            where: {
                userId: uid,
                day: { gte: weekStart },
            },
        }),
        db.llmUsageEvent.groupBy({
            by: ["model", "provider"],
            where: {
                userId: uid,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            _sum: {
                inputTokens: true,
                outputTokens: true,
                cacheReadTokens: true,
                totalTokens: true,
            },
            _count: { _all: true },
        }),
        checkLlmQuota(uid, timeZone),
    ])

    const last7Days = weekRows.reduce(
        (acc, row) => {
            acc.inputTokens += row.llmInputTokens
            acc.outputTokens += row.llmOutputTokens
            acc.totalTokens += row.llmTotalTokens
            acc.requests += row.llmRequests
            return acc
        },
        { inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0 }
    )

    const byModel = modelGroups
        .map((g) => ({
            model: g.model,
            provider: g.provider,
            inputTokens: g._sum.inputTokens ?? 0,
            outputTokens: g._sum.outputTokens ?? 0,
            cacheReadTokens: g._sum.cacheReadTokens ?? 0,
            totalTokens: g._sum.totalTokens ?? 0,
            requests: g._count._all,
        }))
        .sort((a, b) => b.totalTokens - a.totalTokens)

    return {
        today: {
            inputTokens: todayRow?.llmInputTokens ?? 0,
            outputTokens: todayRow?.llmOutputTokens ?? 0,
            totalTokens: todayRow?.llmTotalTokens ?? 0,
            requests: todayRow?.llmRequests ?? 0,
        },
        last7Days,
        byModel,
        quota,
    }
}
