import db from "@/lib/db"
import { getUsageConfig } from "@/lib/usage/config"
import {
    dayKeyInTimeZone,
    formatTimeUntil,
    nextMidnightInTimeZone,
    resolveTimeZone,
} from "@/lib/usage/day"

export type QuotaLevel = "ok" | "soft" | "hard"

export type QuotaCheckResult = {
    level: QuotaLevel
    enforce: boolean
    blocked: boolean
    reasons: string[]
    resetsInLabel: string | null
    dayResetsInLabel: string
    timeZone: string
    usage: {
        tokensToday: number
        requestsToday: number
        requestsLastMinute: number
        tokensPerDayLimit: number
        requestsPerDayLimit: number
        requestsPerMinuteLimit: number
        softTokenThreshold: number
    }
}

export async function checkLlmQuota(
    userId: string,
    timeZone?: string | null
): Promise<QuotaCheckResult> {
    const config = getUsageConfig()
    const uid = userId?.trim()
    const tz = resolveTimeZone(timeZone)

    const emptyUsage = {
        tokensToday: 0,
        requestsToday: 0,
        requestsLastMinute: 0,
        tokensPerDayLimit: config.llmTokensPerDay,
        requestsPerDayLimit: config.llmRequestsPerDay,
        requestsPerMinuteLimit: config.llmRequestsPerMinute,
        softTokenThreshold: Math.floor(config.llmTokensPerDay * config.llmTokensSoftRatio),
    }

    const dayResetAt = nextMidnightInTimeZone(tz)
    const dayResetsHint = `Resets in ${formatTimeUntil(dayResetAt)}.`

    if (!uid || uid === "local-dev") {
        return {
            level: "ok",
            enforce: config.enforce,
            blocked: false,
            reasons: [],
            resetsInLabel: null,
            dayResetsInLabel: dayResetsHint,
            timeZone: tz,
            usage: emptyUsage,
        }
    }

    const day = dayKeyInTimeZone(new Date(), tz)
    const rateResetsHint = "Try again in a moment."
    const oneMinuteAgo = new Date(Date.now() - 60_000)

    const [daily, requestsLastMinute] = await Promise.all([
        db.userUsageDaily.findUnique({
            where: { userId_day: { userId: uid, day } },
            select: {
                llmTotalTokens: true,
                llmRequests: true,
            },
        }),
        db.llmUsageEvent.count({
            where: {
                userId: uid,
                createdAt: { gte: oneMinuteAgo },
            },
        }),
    ])

    const tokensToday = daily?.llmTotalTokens ?? 0
    const requestsToday = daily?.llmRequests ?? 0
    const softTokenThreshold = Math.floor(config.llmTokensPerDay * config.llmTokensSoftRatio)

    const reasons: string[] = []
    let level: QuotaLevel = "ok"
    let resetsInLabel: string | null = null
    let hardIsMinuteRate = false

    if (requestsLastMinute >= config.llmRequestsPerMinute) {
        level = "hard"
        hardIsMinuteRate = true
        reasons.push("You're sending messages too quickly.")
        resetsInLabel = rateResetsHint
    }

    if (requestsToday >= config.llmRequestsPerDay) {
        level = "hard"
        reasons.push("You've reached today's message limit.")
        if (!hardIsMinuteRate) resetsInLabel = dayResetsHint
    }

    if (tokensToday >= config.llmTokensPerDay) {
        level = "hard"
        reasons.push("You've reached today's AI usage limit.")
        if (!hardIsMinuteRate) resetsInLabel = dayResetsHint
    } else if (tokensToday >= softTokenThreshold && level !== "hard") {
        level = "soft"
        reasons.push("You're approaching today's AI usage limit.")
        resetsInLabel = dayResetsHint
    } else if (
        requestsToday >= Math.floor(config.llmRequestsPerDay * config.llmTokensSoftRatio) &&
        level !== "hard"
    ) {
        level = "soft"
        reasons.push("You're approaching today's message limit.")
        resetsInLabel = dayResetsHint
    }

    if (
        level === "hard" &&
        hardIsMinuteRate &&
        (requestsToday >= config.llmRequestsPerDay || tokensToday >= config.llmTokensPerDay)
    ) {
        resetsInLabel = dayResetsHint
    }

    const blocked = config.enforce && level === "hard"

    return {
        level,
        enforce: config.enforce,
        blocked,
        reasons,
        resetsInLabel,
        dayResetsInLabel: dayResetsHint,
        timeZone: tz,
        usage: {
            tokensToday,
            requestsToday,
            requestsLastMinute,
            tokensPerDayLimit: config.llmTokensPerDay,
            requestsPerDayLimit: config.llmRequestsPerDay,
            requestsPerMinuteLimit: config.llmRequestsPerMinute,
            softTokenThreshold,
        },
    }
}
