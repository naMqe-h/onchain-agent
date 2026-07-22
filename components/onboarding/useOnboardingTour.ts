import { useCallback } from 'react'
import { driver } from 'driver.js'
import { useOnboardingStore } from '../../hooks/useOnboardingStore'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { type SettingsTab } from '@/types'

interface FeatureStep {
    element: string
    title: string
    description: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    onHighlightStarted?: () => void
}

export function useOnboardingTour() {
    const markFeatureSeen = useOnboardingStore((s) => s.markFeatureSeen)
    const completeTour = useOnboardingStore((s) => s.completeTour)
    const seenFeatures = useOnboardingStore((s) => s.seenFeatures)

    const startFullTour = useCallback(() => {
        const openSettingsTab = (tab: SettingsTab) => {
            const isAlreadyOpen = useSettingsStore.getState().isOpen
            useSettingsStore.getState().openSettings(tab)
            if (!isAlreadyOpen) {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'))
                }, 120)
            }
        }

        const tourSteps: FeatureStep[] = [
            {
                element: '[data-tour="model-selector"]',
                title: 'AI Model Selector',
                description: 'Switch between different language models with tailored reasoning capabilities, response speed, and context size.',
                side: 'bottom',
                align: 'start',
            },
            {
                element: '[data-tour="network-selector"]',
                title: 'EVM Blockchain Networks',
                description: 'Select target EVM networks for on-chain operations.',
                side: 'bottom',
                align: 'center',
            },
            {
                element: '[data-tour="chat-input"]',
                title: 'AI Agent Chat',
                description: 'Type natural language commands - query token prices, execute swaps, inspect transaction analytics, and manage your wallet.',
                side: 'top',
                align: 'center',
            },
            {
                element: '[data-tour="wallet-button"]',
                title: 'EVM Wallet Management',
                description: 'Create and add Web3 wallets. All keys are securely encrypted.',
                side: 'right',
                align: 'end',
            },
            {
                element: '[data-tour="new-chat-button"]',
                title: 'New Chat',
                description: 'Start new chat sessions. Your previous chat history are saved automatically.',
                side: 'right',
                align: 'start',
            },
            {
                element: '[data-tour="search-chats"]',
                title: 'Search Conversations',
                description: 'Quickly search through past chats, queries, and transaction records.',
                side: 'right',
                align: 'start',
            },
            {
                element: '[data-tour="sidebar-folders"]',
                title: 'Chat Folders',
                description: 'Organize your conversation history into custom folders to keep your Web3 workflows structured.',
                side: 'right',
                align: 'center',
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: Wallets',
                description: 'Manage and create Web3 wallets, inspect account addresses and private key encryption.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('wallets')
                },
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: Address Book',
                description: 'Save recipient addresses with custom labels for instant access during transactions.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('addressBook')
                },
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: Security',
                description: 'Configure transaction confirmation rules (Always, Agent Decides, Never) and restrict transfers to your verified Address Allowlist.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('security')
                },
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: Network',
                description: 'Configure default target EVM network.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('network')
                },
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: AI Models',
                description: 'Select any AI model for your chats and view key parameters including latency, context size, and reasoning capabilities.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('models')
                },
            },
            {
                element: '[data-tour="settings-panel"]',
                title: 'Settings: Usage & Quotas',
                description: 'Track daily token consumption, request quotas, and usage history.',
                side: 'left',
                align: 'center',
                onHighlightStarted: () => {
                    openSettingsTab('usage')
                },
            },
        ]

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            nextBtnText: 'Next >',
            prevBtnText: '< Back',
            doneBtnText: 'Finish',
            progressText: 'Step {{current}} of {{total}}',
            onDestroyed: () => {
                useSettingsStore.getState().closeSettings()
                completeTour()
            },
            steps: tourSteps.map((step) => ({
                element: step.element,
                popover: {
                    title: step.title,
                    description: step.description,
                    side: step.side || 'bottom',
                    align: step.align || 'start',
                },
                onHighlightStarted: step.onHighlightStarted,
            })),
        })

        driverObj.drive()
    }, [completeTour])

    const showFeaturePopup = useCallback(
        (featureId: string, step: FeatureStep) => {
            if (seenFeatures[featureId]) return

            const el = document.querySelector(step.element)
            if (!el) return

            const driverObj = driver({
                showProgress: false,
                animate: true,
                allowClose: true,
                doneBtnText: 'Got it',
                onDestroyed: () => {
                    markFeatureSeen(featureId)
                },
            })

            driverObj.highlight({
                element: step.element,
                popover: {
                    title: step.title,
                    description: step.description,
                    side: step.side || 'bottom',
                    align: step.align || 'center',
                },
                onHighlightStarted: step.onHighlightStarted,
            })
        },
        [seenFeatures, markFeatureSeen]
    )

    return {
        startFullTour,
        showFeaturePopup,
    }
}
