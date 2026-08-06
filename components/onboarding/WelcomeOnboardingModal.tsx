'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
    FiX,
    FiCpu,
    FiTrendingUp,
    FiShield,
    FiZap,
    FiCompass,
    FiChevronRight,
    FiChevronLeft,
    FiRepeat,
    FiSend,
    FiBarChart2,
} from 'react-icons/fi'
import { User } from '@supabase/supabase-js'
import { createClient } from '../../lib/supabase/client'
import { fadeInOut, scaleIn } from '../../lib/motion'
import { useOnboardingStore } from '../../hooks/useOnboardingStore'
import { useOnboardingTour } from './useOnboardingTour'

const slideVariants: Variants = {
    initial: (dir: number) => ({
        x: dir > 0 ? 60 : dir < 0 ? -60 : 0,
        opacity: 0,
        scale: 0.97,
    }),
    animate: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
        },
    },
    exit: (dir: number) => ({
        x: dir > 0 ? -60 : 60,
        opacity: 0,
        scale: 0.97,
        transition: {
            duration: 0.18,
            ease: 'easeIn',
        },
    }),
}

interface WelcomeOnboardingModalProps {
    user?: User | null
}

export default function WelcomeOnboardingModal({ user }: WelcomeOnboardingModalProps = {}) {
    const isWelcomeOpen = useOnboardingStore((s) => s.isWelcomeOpen)
    const completeWelcome = useOnboardingStore((s) => s.completeWelcome)
    const { startFullTour } = useOnboardingTour()
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)
    const backdropRef = useRef<HTMLDivElement>(null)

    const syncMetadata = useCallback(async () => {
        completeWelcome()
        if (user) {
            try {
                const supabase = createClient()
                await supabase.auth.updateUser({
                    data: { hasCompletedWelcome: true },
                })
            } catch { }
        }
    }, [completeWelcome, user])

    useEffect(() => {
        if (!isWelcomeOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                void syncMetadata()
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isWelcomeOpen, syncMetadata])

    if (!isWelcomeOpen) return null

    const handleStartTour = () => {
        void syncMetadata()
        setTimeout(() => {
            startFullTour()
        }, 300)
    }

    const goToStep = (newStep: number) => {
        setDirection(newStep > currentStep ? 1 : -1)
        setCurrentStep(newStep)
    }

    const steps = [
        {
            title: 'Welcome to Onchain Agent!',
            subtitle: 'Autonomous AI platform for Web3 transactions and blockchain analytics',
            icon: FiZap,
            content: (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        Onchain Agent is an intelligent Web3 assistant that helps you execute on-chain operations using natural language.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                        <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                                <FiCpu size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-200">AI Model Selection</h4>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                    Choose between multiple language models with varying reasoning depth, response speed, and context windows.
                                </p>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                                <FiShield size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-200">EVM & Network Analytics</h4>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                    Native on-chain transactions across 5 EVM networks, plus token analytics for dozens of blockchain networks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Core Features & Capabilities',
            subtitle: 'Powerful Web3 functionality built directly into conversational AI',
            icon: FiTrendingUp,
            content: (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        Onchain Agent provides essential Web3 operations accessible via natural conversation:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                        <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-2.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit">
                                <FiRepeat size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-200">Token Swap</h4>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                                    Execute automated multi-chain token swaps with optimal routing and slippage protection.
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit">
                                <FiSend size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-200">Send ERC20 & Native</h4>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                                    Transfer native currency and ERC20 tokens directly to any address or contact.
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-2.5">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 w-fit">
                                <FiBarChart2 size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-zinc-200">Crypto & Tokens Analytics</h4>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                                    Access real-time price trends, 7D charts, liquidity data, and transaction tracking.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Quick Interface Tour',
            subtitle: 'Would you like an interactive walkthrough of key features?',
            icon: FiCompass,
            content: (
                <div className="flex flex-col gap-4 text-center py-2">
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        We can guide you through the main interface components step by step.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
                        <button
                            type="button"
                            onClick={handleStartTour}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
                        >
                            <FiCompass size={16} />
                            Start Tour
                        </button>
                        <button
                            type="button"
                            onClick={syncMetadata}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-medium text-xs transition-colors cursor-pointer border border-white/10"
                        >
                            Explore on my own
                        </button>
                    </div>
                </div>
            ),
        },
    ]

    const activeStep = steps[currentStep]
    const Icon = activeStep.icon

    return (
        <AnimatePresence>
            <motion.div
                ref={backdropRef}
                variants={fadeInOut}
                initial="initial"
                animate="animate"
                exit="exit"
                className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
                onClick={(e) => {
                    if (e.target === backdropRef.current) void syncMetadata()
                }}
            >
                <motion.div
                    variants={scaleIn}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full max-w-2xl rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#141416]/60">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                            <span>Step</span>
                            <span className="text-emerald-400 font-mono">{currentStep + 1}</span>
                            <span>/</span>
                            <span className="text-zinc-500 font-mono">{steps.length}</span>
                        </div>
                        <button
                            type="button"
                            onClick={syncMetadata}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                            aria-label="Close onboarding"
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    <div className="relative overflow-hidden min-h-72.5">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="p-6 flex flex-col gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-zinc-100 leading-tight">
                                            {activeStep.title}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {activeStep.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 min-h-45 flex flex-col justify-center">
                                    {activeStep.content}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#141416]/40">
                        <div className="flex items-center gap-1.5">
                            {steps.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => goToStep(idx)}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentStep
                                        ? 'w-6 bg-emerald-500'
                                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                                        }`}
                                    aria-label={`Go to step ${idx + 1}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => goToStep(currentStep - 1)}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-white/5"
                                >
                                    <FiChevronLeft size={14} />
                                    Back
                                </button>
                            )}

                            {currentStep < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => goToStep(currentStep + 1)}
                                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    Next
                                    <FiChevronRight size={14} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={syncMetadata}
                                    className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer border border-white/10"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
