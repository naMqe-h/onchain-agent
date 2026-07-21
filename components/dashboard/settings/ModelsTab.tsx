'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiCheck, FiAlertCircle, FiChevronDown, FiZap, FiDatabase } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'
import { createClient } from '../../../lib/supabase/client'
import {
    DEFAULT_MODEL_ID,
    formatContextWindow,
    getContextTier,
    getLatencyTier,
    type ContextTier,
    type LatencyTier,
} from '../../../lib/models'
import { useModelsStore } from '../../../hooks/useModelsStore'
import { resolveUserModelPreferences } from '../../../lib/modelPreferences'

const LATENCY_TIER_CLASS: Record<LatencyTier, string> = {
    Low: 'text-emerald-400',
    Medium: 'text-amber-400',
    High: 'text-rose-400',
}

const CONTEXT_TIER_CLASS: Record<ContextTier, string> = {
    Large: 'text-emerald-400',
    Medium: 'text-amber-400',
    Small: 'text-rose-400',
}

interface ModelsTabProps {
    user: User | null
}

export default function ModelsTab({ user }: ModelsTabProps) {
    const router = useRouter()
    const catalog = useModelsStore((s) => s.models)
    const status = useModelsStore((s) => s.status)
    const loadModels = useModelsStore((s) => s.loadModels)

    useEffect(() => {
        if (status === 'idle') {
            void loadModels()
        }
    }, [status, loadModels])

    const [enabledModels, setEnabledModels] = useState<string[]>([])
    const [selectedDefaultModel, setSelectedDefaultModel] = useState<string>(DEFAULT_MODEL_ID)
    const [prefsHydrated, setPrefsHydrated] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isDefaultOpen, setIsDefaultOpen] = useState(false)

    useEffect(() => {
        if (catalog.length === 0) return
        const prefs = resolveUserModelPreferences(catalog, {
            defaultModel: user?.user_metadata?.defaultModel as string | undefined,
            enabledModels: user?.user_metadata?.enabledModels as string[] | undefined,
        })
        setEnabledModels(prefs.enabledModelIds)
        setSelectedDefaultModel(prefs.defaultModelId)
        setPrefsHydrated(true)

        if (prefs.didHeal && prefs.healedMetadata && user) {
            void (async () => {
                try {
                    const supabase = createClient()
                    await supabase.auth.updateUser({
                        data: {
                            defaultModel: prefs.healedMetadata!.defaultModel,
                            enabledModels: prefs.healedMetadata!.enabledModels,
                        },
                    })
                    router.refresh()
                } catch (err) {
                    console.error('Failed to heal model preferences:', err)
                }
            })()
        }
    }, [catalog, user, router])

    const activeDefaultModel = catalog.find((m) => m.id === selectedDefaultModel)

    const saveSettings = async (newEnabled: string[], newDefault: string) => {
        setIsUpdating(true)
        setSuccessMessage('')
        setErrorMessage('')

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                data: {
                    enabledModels: newEnabled,
                    defaultModel: newDefault,
                },
            })

            if (error) {
                throw error
            }

            setEnabledModels(newEnabled)
            setSelectedDefaultModel(newDefault)
            setSuccessMessage('Model settings updated successfully')
            router.refresh()
        } catch (err: unknown) {
            console.error('Failed to update model settings:', err)
            setErrorMessage('Failed to update model settings. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleToggleModel = async (modelId: string) => {
        if (isUpdating) return

        const isEnabled = enabledModels.includes(modelId)

        if (isEnabled) {
            if (enabledModels.length <= 1) {
                setErrorMessage('At least one model must be enabled')
                return
            }

            const nextEnabled = enabledModels.filter((id) => id !== modelId)

            let nextDefault = selectedDefaultModel
            if (selectedDefaultModel === modelId) {
                const remaining = catalog.find((m) => nextEnabled.includes(m.id))
                if (remaining) {
                    nextDefault = remaining.id
                }
            }

            await saveSettings(nextEnabled, nextDefault)
        } else {
            const nextEnabled = [...enabledModels, modelId]
            await saveSettings(nextEnabled, selectedDefaultModel)
        }
    }

    const handleSetDefaultModel = async (modelId: string) => {
        if (isUpdating || selectedDefaultModel === modelId) return

        if (!enabledModels.includes(modelId)) {
            setErrorMessage('Cannot set a disabled model as the default model')
            return
        }

        await saveSettings(enabledModels, modelId)
    }

    if (status === 'loading' || (status === 'idle' && catalog.length === 0) || !prefsHydrated) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="pb-3 border-b border-white/5 shrink-0">
                    <h2 className="text-lg font-medium text-zinc-100">Models Settings</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Configure available models and choose the default model for new chats.</p>
                </div>
                <div className="flex-1 pt-6 text-xs text-zinc-500 animate-pulse">Loading models…</div>
            </div>
        )
    }

    if (catalog.length === 0) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="pb-3 border-b border-white/5 shrink-0">
                    <h2 className="text-lg font-medium text-zinc-100">Models Settings</h2>
                </div>
                <div className="flex-1 pt-6 text-xs text-zinc-500">No models available.</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Models Settings</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Configure available models and choose the default model for new chats.</p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6 pr-1">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Default Model
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => setIsDefaultOpen(!isDefaultOpen)}
                            className="w-full flex items-center justify-between bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <span>
                                {activeDefaultModel ? activeDefaultModel.name : 'Select model'}
                            </span>
                            <FiChevronDown className={`transition-transform duration-200 text-zinc-400 ${isDefaultOpen ? 'rotate-180' : ''}`} size={16} />
                        </button>

                        {isDefaultOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsDefaultOpen(false)} />
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-56">
                                    {catalog.filter((m) => enabledModels.includes(m.id)).map((m) => {
                                        const isSelected = selectedDefaultModel === m.id
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    handleSetDefaultModel(m.id)
                                                    setIsDefaultOpen(false)
                                                }}
                                                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                                    }`}
                                            >
                                                <span className="truncate">{m.name}</span>
                                                {isSelected && (
                                                    <FiCheck size={14} className="text-purple-400 shrink-0" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Models</span>
                    <div className="flex flex-col">
                        {catalog.map((m) => {
                            const isEnabled = enabledModels.includes(m.id)
                            const latencyTier = getLatencyTier(m.latencyMs ?? 0)
                            const contextTier = getContextTier(m.contextTokens ?? 0)
                            const contextLabel = formatContextWindow(m.contextTokens ?? 0)
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => handleToggleModel(m.id)}
                                    className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 transition-opacity cursor-pointer ${isEnabled ? 'opacity-100' : 'opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-200 select-none flex-1 mr-4 min-w-0">
                                        <span className="truncate">{m.name}</span>
                                        <span className="inline-flex items-center gap-2 shrink-0">
                                            {m.isReasoning && (
                                                <span
                                                    className="inline-flex items-center text-purple-400"
                                                    title="Reasoning"
                                                    aria-label="Reasoning"
                                                >
                                                    <TbBrain size={13} />
                                                </span>
                                            )}
                                            <span
                                                className={`inline-flex items-center ${LATENCY_TIER_CLASS[latencyTier]}`}
                                                title={`Latency: ${latencyTier}`}
                                                aria-label={`Latency: ${latencyTier}`}
                                            >
                                                <FiZap size={12} />
                                            </span>
                                            <span
                                                className={`inline-flex items-center ${CONTEXT_TIER_CLASS[contextTier]}`}
                                                title={`Context: ${contextLabel}`}
                                                aria-label={`Context: ${contextLabel}`}
                                            >
                                                <FiDatabase size={12} />
                                            </span>
                                        </span>
                                    </div>
                                    <div
                                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${isEnabled ? 'bg-purple-600' : 'bg-zinc-700'
                                            }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {isUpdating && (
                    <div className="text-xs text-zinc-500 animate-pulse flex items-center gap-2 mt-2">
                        Updating models configuration...
                    </div>
                )}

                {errorMessage && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl mt-2 flex items-center gap-2">
                        <FiAlertCircle size={14} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {successMessage && !isUpdating && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl mt-2">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    )
}
