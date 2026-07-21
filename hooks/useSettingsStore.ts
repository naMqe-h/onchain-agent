import { SettingsTab } from '@/types'
import { create } from 'zustand'

interface SettingsStore {
    isOpen: boolean
    activeTab: SettingsTab
    openSettings: (tab?: SettingsTab) => void
    closeSettings: () => void
    setActiveTab: (tab: SettingsTab) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
    isOpen: false,
    activeTab: 'profile',
    openSettings: (tab = 'profile') => set({ isOpen: true, activeTab: tab }),
    closeSettings: () => set({ isOpen: false }),
    setActiveTab: (tab) => set({ activeTab: tab }),
}))
