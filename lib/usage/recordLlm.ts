import db from "@/lib/db"
import { dayKeyInTimeZone } from "@/lib/usage/day"

import { type RecordLlmUsageInput } from "@/types"

function nonNegInt(n: unknown): number {
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return 0
    return Math.floor(n)
}

export async function recordLlmUsage(input: RecordLlmUsageInput): Promise<void> {
    const userId = input.userId?.trim()
    if (!userId || userId === "local-dev") return

    const inputTokens = nonNegInt(input.inputTokens)
    const outputTokens = nonNegInt(input.outputTokens)
    const cacheReadTokens = nonNegInt(input.cacheReadTokens)
    const cacheWriteTokens = nonNegInt(input.cacheWriteTokens)
    const totalTokens = inputTokens + outputTokens

    const day = dayKeyInTimeZone(new Date(), input.timeZone)

    await db.$transaction(async (tx) => {
        await tx.llmUsageEvent.create({
            data: {
                userId,
                chatId: input.chatId || null,
                eveSessionId: input.eveSessionId || null,
                model: input.model || "unknown",
                provider: input.provider || "unknown",
                stepIndex: typeof input.stepIndex === "number" ? input.stepIndex : null,
                inputTokens,
                outputTokens,
                cacheReadTokens,
                cacheWriteTokens,
                totalTokens,
                source: input.source,
                durationMs:
                    typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
                        ? Math.floor(input.durationMs)
                        : null,
            },
        })

        await tx.userUsageDaily.upsert({
            where: {
                userId_day: { userId, day },
            },
            create: {
                userId,
                day,
                llmInputTokens: inputTokens,
                llmOutputTokens: outputTokens,
                llmTotalTokens: totalTokens,
                llmRequests: 1,
            },
            update: {
                llmInputTokens: { increment: inputTokens },
                llmOutputTokens: { increment: outputTokens },
                llmTotalTokens: { increment: totalTokens },
                llmRequests: { increment: 1 },
            },
        })
    })
}
