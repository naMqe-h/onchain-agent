'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiAlertCircle, FiCpu, FiKey } from 'react-icons/fi'
import { createClient } from '../../../lib/supabase/client'
import {
    DEFAULT_MODEL_ID,
    type ContextTier,
    type LatencyTier,
} from '../../../lib/models'
import { useModelsStore } from '../../../hooks/useModelsStore'
import { resolveUserModelPreferences } from '../../../lib/modelPreferences'
import {
    getUserProviderKeys,
    saveUserProviderKey,
    deleteUserProviderKey,
    type PublicProviderKeyInfo,
} from '../../../app/actions/models/providerKeys'
import {
    getUserCustomModels,
    addCustomModel,
    deleteCustomModel,
    type CustomModelRecord,
} from '../../../app/actions/models/customModels'
import {
    BYOK_PROVIDER_CATALOG,
    type PredefinedBYOKModel,
} from '../../../lib/byokModelsCatalog'

import DefaultModelSelector from './models/DefaultModelSelector'
import AppModelsList from './models/AppModelsList'
import BYOKProviderCatalog from './models/BYOKProviderCatalog'
import AdvancedCustomModelForm from './models/AdvancedCustomModelForm'
import ProviderApiKeysList from './models/ProviderApiKeysList'

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

const KNOWN_PROVIDERS = [
    { id: 'openai', label: 'OpenAI', icon: 'openai.png', placeholder: 'sk-proj-...' },
    { id: 'openrouter', label: 'OpenRouter', icon: 'openrouter.png', placeholder: 'sk-or-v1-...' },
    { id: 'google', label: 'Google Gemini', icon: 'gemini.png', placeholder: 'AIzaSy...' },
    { id: 'anthropic', label: 'Anthropic Claude', icon: 'claude.png', placeholder: 'sk-ant-...' },
    { id: 'xai', label: 'xAI (Grok)', icon: 'grok.png', placeholder: 'xai-...' },
]

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

    const [activeSubTab, setActiveSubTab] = useState<'models' | 'providers'>('models')
    const [enabledModels, setEnabledModels] = useState<string[]>([])
    const [selectedDefaultModel, setSelectedDefaultModel] = useState<string>(DEFAULT_MODEL_ID)
    const [prefsHydrated, setPrefsHydrated] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isDefaultOpen, setIsDefaultOpen] = useState(false)

    const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
    const [editingProviderId, setEditingProviderId] = useState<string | null>(null)
    const [providerKeys, setProviderKeys] = useState<PublicProviderKeyInfo[]>([])
    const [customModels, setCustomModels] = useState<CustomModelRecord[]>([])
    const [savingProvider, setSavingProvider] = useState<string | null>(null)
    const [deletingProvider, setDeletingProvider] = useState<string | null>(null)

    const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({
        openai: true,
        anthropic: true,
        google: false,
        xai: false,
        openrouter: false,
    })
    const [togglingModelId, setTogglingModelId] = useState<string | null>(null)

    const [showManualForm, setShowManualForm] = useState(false)
    const [newModelId, setNewModelId] = useState('')
    const [newModelName, setNewModelName] = useState('')
    const [newModelProvider, setNewModelProvider] = useState('openai')
    const [isCustomModelProviderOpen, setIsCustomModelProviderOpen] = useState(false)
    const [newModelReasoning, setNewModelReasoning] = useState(false)
    const [isAddingModel, setIsAddingModel] = useState(false)

    const fetchBYOKData = async () => {
        try {
            const [keys, userModels] = await Promise.all([
                getUserProviderKeys(),
                getUserCustomModels(),
            ])
            setProviderKeys(keys)
            setCustomModels(userModels)
        } catch (err) {
            console.error('Failed to load BYOK data:', err)
        }
    }

    useEffect(() => {
        if (user) {
            void fetchBYOKData()
        }
    }, [user])

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

    const handleSaveKey = async (provider: string) => {
        const val = keyInputs[provider]?.trim()
        if (!val) return
        setSavingProvider(provider)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            await saveUserProviderKey(provider, val)
            setKeyInputs((prev) => ({ ...prev, [provider]: '' }))
            setEditingProviderId(null)
            setSuccessMessage(`API Key for ${provider.toUpperCase()} saved successfully`)
            await fetchBYOKData()
            await loadModels(true)
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save provider API key')
        } finally {
            setSavingProvider(null)
        }
    }

    const handleDeleteKey = async (provider: string) => {
        setDeletingProvider(provider)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            await deleteUserProviderKey(provider)
            setEditingProviderId(null)
            setSuccessMessage(`API Key for ${provider.toUpperCase()} deleted`)
            await fetchBYOKData()
            await loadModels(true)
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to delete provider API key')
        } finally {
            setDeletingProvider(null)
        }
    }

    const handleToggleBYOKModel = async (model: PredefinedBYOKModel) => {
        setTogglingModelId(model.modelId)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            const existingRecord = customModels.find((cm) => cm.modelId === model.modelId)

            if (existingRecord) {
                await deleteCustomModel(existingRecord.id)
                setSuccessMessage(`Model '${model.name}' disabled`)
            } else {
                await addCustomModel({
                    modelId: model.modelId,
                    name: model.name,
                    provider: model.provider,
                    isReasoning: Boolean(model.isReasoning),
                })
                setSuccessMessage(`Model '${model.name}' enabled`)
            }

            await fetchBYOKData()
            await loadModels(true)
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update BYOK model status')
        } finally {
            setTogglingModelId(null)
        }
    }

    const handleAddManualCustomModel = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newModelId.trim()) return

        setIsAddingModel(true)
        setErrorMessage('')
        setSuccessMessage('')

        try {
            await addCustomModel({
                modelId: newModelId.trim(),
                name: newModelName.trim() || newModelId.trim(),
                provider: newModelProvider,
                isReasoning: newModelReasoning,
            })

            setNewModelId('')
            setNewModelName('')
            setNewModelReasoning(false)
            setShowManualForm(false)
            setSuccessMessage(`Custom model '${newModelId.trim()}' added successfully`)
            await fetchBYOKData()
            await loadModels(true)
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to add custom model')
        } finally {
            setIsAddingModel(false)
        }
    }

    const appModels = catalog.filter((m) => m.section === 'app' || !m.section)
    const userModels = catalog.filter((m) => m.section === 'user')
    const activeProviders = new Set(providerKeys.map((k) => k.provider.toLowerCase()))
    const currentCustomModelProviderInfo = KNOWN_PROVIDERS.find((p) => p.id === newModelProvider)

    if (status === 'loading' || (status === 'idle' && catalog.length === 0) || !prefsHydrated) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="pb-3 border-b border-white/5 shrink-0">
                    <h2 className="text-lg font-medium text-zinc-100">Models Settings</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Configure available models and set up your own provider API keys (BYOK).</p>
                </div>
                <div className="flex-1 pt-6 text-xs text-zinc-500 animate-pulse">Loading models…</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0 flex flex-col gap-3">
                <div>
                    <h2 className="text-lg font-medium text-zinc-100">Models & Providers</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage model availability, default options, and API key providers.</p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-[#141416] rounded-xl border border-white/5 w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('models')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeSubTab === 'models' ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <FiCpu size={14} />
                        <span>Models</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('providers')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${activeSubTab === 'providers' ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        <FiKey size={14} />
                        <span>Providers</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 flex flex-col gap-6 pr-1">
                {activeSubTab === 'models' && (
                    <>
                        <DefaultModelSelector
                            selectedDefaultModel={selectedDefaultModel}
                            activeDefaultModel={activeDefaultModel}
                            isUpdating={isUpdating}
                            isDefaultOpen={isDefaultOpen}
                            setIsDefaultOpen={setIsDefaultOpen}
                            appModels={appModels}
                            userModels={userModels}
                            enabledModels={enabledModels}
                            handleSetDefaultModel={handleSetDefaultModel}
                        />

                        <AppModelsList
                            appModels={appModels}
                            enabledModels={enabledModels}
                            handleToggleModel={handleToggleModel}
                            LATENCY_TIER_CLASS={LATENCY_TIER_CLASS}
                            CONTEXT_TIER_CLASS={CONTEXT_TIER_CLASS}
                        />

                        <BYOKProviderCatalog
                            BYOK_PROVIDER_CATALOG={BYOK_PROVIDER_CATALOG}
                            activeProviders={activeProviders}
                            expandedProviders={expandedProviders}
                            setExpandedProviders={setExpandedProviders}
                            customModels={customModels}
                            togglingModelId={togglingModelId}
                            handleToggleBYOKModel={handleToggleBYOKModel}
                            setActiveSubTab={setActiveSubTab}
                            CONTEXT_TIER_CLASS={CONTEXT_TIER_CLASS}
                        />

                        <AdvancedCustomModelForm
                            showManualForm={showManualForm}
                            setShowManualForm={setShowManualForm}
                            newModelId={newModelId}
                            setNewModelId={setNewModelId}
                            newModelName={newModelName}
                            setNewModelName={setNewModelName}
                            newModelProvider={newModelProvider}
                            setNewModelProvider={setNewModelProvider}
                            isCustomModelProviderOpen={isCustomModelProviderOpen}
                            setIsCustomModelProviderOpen={setIsCustomModelProviderOpen}
                            newModelReasoning={newModelReasoning}
                            setNewModelReasoning={setNewModelReasoning}
                            isAddingModel={isAddingModel}
                            activeProviders={activeProviders}
                            KNOWN_PROVIDERS={KNOWN_PROVIDERS}
                            currentCustomModelProviderInfo={currentCustomModelProviderInfo}
                            handleAddManualCustomModel={handleAddManualCustomModel}
                        />
                    </>
                )}

                {activeSubTab === 'providers' && (
                    <ProviderApiKeysList
                        KNOWN_PROVIDERS={KNOWN_PROVIDERS}
                        providerKeys={providerKeys}
                        editingProviderId={editingProviderId}
                        setEditingProviderId={setEditingProviderId}
                        keyInputs={keyInputs}
                        setKeyInputs={setKeyInputs}
                        savingProvider={savingProvider}
                        deletingProvider={deletingProvider}
                        handleSaveKey={handleSaveKey}
                        handleDeleteKey={handleDeleteKey}
                    />
                )}

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
