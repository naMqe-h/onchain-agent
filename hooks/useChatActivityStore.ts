import { create } from 'zustand'

interface ChatActivityStore {
    runningChats: Record<string, boolean>
    setChatRunning: (chatId: string, isRunning: boolean) => void
}

export const useChatActivityStore = create<ChatActivityStore>((set) => ({
    runningChats: {},
    setChatRunning: (chatId, isRunning) =>
        set((state) => ({
            runningChats: {
                ...state.runningChats,
                [chatId]: isRunning,
            },
        })),
}))
