import db from "@/lib/db"

import { type ChatTokenUsage } from "@/types"

export async function getChatTokenUsage(
    userId: string,
    chatId: string
): Promise<ChatTokenUsage> {
    const uid = userId.trim()
    const cid = chatId.trim()
    if (!uid || !cid) {
        return { totalTokens: 0 }
    }

    const chat = await db.chat.findFirst({
        where: { id: cid, userId: uid },
        select: { id: true },
    })
    if (!chat) {
        return { totalTokens: 0 }
    }

    const result = await db.llmUsageEvent.aggregate({
        where: { userId: uid, chatId: cid },
        _sum: { totalTokens: true },
    })

    return {
        totalTokens: result._sum.totalTokens ?? 0,
    }
}
