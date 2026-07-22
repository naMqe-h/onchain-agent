import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
    hasCompletedWelcome: boolean
    hasCompletedTour: boolean
    seenFeatures: Record<string, boolean>
    isWelcomeOpen: boolean
    openWelcome: () => void
    closeWelcome: () => void
    completeWelcome: () => void
    completeTour: () => void
    markFeatureSeen: (featureId: string) => void
    resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            hasCompletedWelcome: false,
            hasCompletedTour: false,
            seenFeatures: {},
            isWelcomeOpen: false,

            openWelcome: () => set({ isWelcomeOpen: true }),
            closeWelcome: () => set({ isWelcomeOpen: false }),
            completeWelcome: () =>
                set({
                    hasCompletedWelcome: true,
                    isWelcomeOpen: false,
                }),
            completeTour: () => set({ hasCompletedTour: true }),
            markFeatureSeen: (featureId: string) =>
                set((state) => ({
                    seenFeatures: {
                        ...state.seenFeatures,
                        [featureId]: true,
                    },
                })),
            resetOnboarding: () =>
                set({
                    hasCompletedWelcome: false,
                    hasCompletedTour: false,
                    seenFeatures: {},
                    isWelcomeOpen: true,
                }),
        }),
        {
            name: 'onchain-agent-onboarding',
            partialize: (state) => ({
                hasCompletedWelcome: state.hasCompletedWelcome,
                hasCompletedTour: state.hasCompletedTour,
                seenFeatures: state.seenFeatures,
            }),
        }
    )
)
