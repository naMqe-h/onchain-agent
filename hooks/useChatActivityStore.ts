import { create } from 'zustand'

interface ChatActivityStore {
    runningChats: Record<string, boolean>
    runningStartTimes: Record<string, number>
    completedUnreadChats: Record<string, boolean>
    setChatRunning: (chatId: string, isRunning: boolean) => void
    clearChatUnread: (chatId: string) => void
}

export const useChatActivityStore = create<ChatActivityStore>((set) => ({
    runningChats: {},
    runningStartTimes: {},
    completedUnreadChats: {},
    setChatRunning: (chatId, isRunning) =>
        set((state) => {
            const nextRunning = { ...state.runningChats, [chatId]: isRunning }
            const nextStartTimes = { ...state.runningStartTimes }
            const nextCompleted = { ...state.completedUnreadChats }

            if (isRunning) {
                if (!nextStartTimes[chatId]) {
                    nextStartTimes[chatId] = Date.now()
                }
                delete nextCompleted[chatId]
            } else {
                delete nextStartTimes[chatId]
                if (state.runningChats[chatId]) {
                    nextCompleted[chatId] = true
                }
            }
            return {
                runningChats: nextRunning,
                runningStartTimes: nextStartTimes,
                completedUnreadChats: nextCompleted,
            }
        }),
    clearChatUnread: (chatId) =>
        set((state) => {
            const nextCompleted = { ...state.completedUnreadChats }
            delete nextCompleted[chatId]
            return { completedUnreadChats: nextCompleted }
        }),
}))
