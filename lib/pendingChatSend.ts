export const PENDING_CHAT_SEND_KEY = 'pending-chat-send'

export type PendingChatSend = {
    chatId: string
    message: string
    model: string
    network: string
    wallet: string
    createdAt: number
}

function parsePending(raw: string | null): PendingChatSend | null {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw) as PendingChatSend
        if (!parsed?.chatId || !parsed.message?.trim()) return null
        if (Date.now() - (parsed.createdAt || 0) > 5 * 60 * 1000) {
            return null
        }
        return parsed
    } catch {
        return null
    }
}

export function writePendingChatSend(payload: PendingChatSend): void {
    try {
        sessionStorage.setItem(PENDING_CHAT_SEND_KEY, JSON.stringify(payload))
    } catch { }
}

export function peekPendingChatSend(chatId: string): PendingChatSend | null {
    try {
        const parsed = parsePending(sessionStorage.getItem(PENDING_CHAT_SEND_KEY))
        if (!parsed || parsed.chatId !== chatId) return null
        return parsed
    } catch {
        return null
    }
}

export function consumePendingChatSend(chatId: string): PendingChatSend | null {
    try {
        const parsed = peekPendingChatSend(chatId)
        if (!parsed) {
            const raw = sessionStorage.getItem(PENDING_CHAT_SEND_KEY)
            if (raw) {
                const any = parsePending(raw)
                if (!any) sessionStorage.removeItem(PENDING_CHAT_SEND_KEY)
            }
            return null
        }
        sessionStorage.removeItem(PENDING_CHAT_SEND_KEY)
        return parsed
    } catch {
        return null
    }
}

export function clearPendingChatSend(): void {
    try {
        sessionStorage.removeItem(PENDING_CHAT_SEND_KEY)
    } catch { }
}
