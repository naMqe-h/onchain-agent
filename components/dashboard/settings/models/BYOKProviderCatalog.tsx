import { FiChevronDown, FiAlertCircle, FiDatabase, FiTrash2 } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'
import type { ContextTier } from '../../../../types'
import { getContextTier, formatContextWindow } from '../../../../lib/models'
import type { CustomModelRecord } from '../../../../app/actions/models/customModels'
import type { PredefinedBYOKModel, ProviderCatalogEntry } from '../../../../lib/byokModelsCatalog'

interface BYOKProviderCatalogProps {
    BYOK_PROVIDER_CATALOG: Record<string, ProviderCatalogEntry>
    activeProviders: Set<string>
    expandedProviders: Record<string, boolean>
    setExpandedProviders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    customModels: CustomModelRecord[]
    togglingModelId: string | null
    handleToggleBYOKModel: (model: PredefinedBYOKModel) => void
    setActiveSubTab: (tab: 'models' | 'providers') => void
    CONTEXT_TIER_CLASS: Record<ContextTier, string>
}

export default function BYOKProviderCatalog({
    BYOK_PROVIDER_CATALOG,
    activeProviders,
    expandedProviders,
    setExpandedProviders,
    customModels,
    togglingModelId,
    handleToggleBYOKModel,
    setActiveSubTab,
    CONTEXT_TIER_CLASS,
}: BYOKProviderCatalogProps) {
    return (
        <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>BYOK Models</span>
                <span className="text-[10px] font-normal text-zinc-500">Toggle models to activate</span>
            </span>

            <div className="flex flex-col gap-3">
                {Object.entries(BYOK_PROVIDER_CATALOG).map(([providerId, entry]) => {
                    const hasKey = activeProviders.has(providerId.toLowerCase())
                    const isExpanded = expandedProviders[providerId] ?? false

                    const predefinedIds = new Set(entry.models.map((m) => m.modelId))
                    const customModelsForProvider = customModels.filter(
                        (cm) => cm.provider.toLowerCase() === providerId.toLowerCase() && !predefinedIds.has(cm.modelId)
                    )

                    const allModelsForProvider: Array<PredefinedBYOKModel & { isUserCustom?: boolean }> = [
                        ...entry.models.map((m) => ({ ...m, isUserCustom: false })),
                        ...customModelsForProvider.map((cm) => ({
                            modelId: cm.modelId,
                            name: cm.name,
                            provider: cm.provider,
                            isReasoning: cm.isReasoning,
                            contextTokens: undefined,
                            description: 'Custom model added manually',
                            isUserCustom: true,
                        })),
                    ]

                    const activeCount = allModelsForProvider.filter((m) =>
                        customModels.some((cm) => cm.modelId === m.modelId)
                    ).length

                    return (
                        <div
                            key={providerId}
                            className={`bg-[#141416]/60 border rounded-xl overflow-hidden transition-colors ${hasKey ? 'border-white/10' : 'border-white/5 opacity-75'}`}
                        >
                            <div
                                onClick={() => setExpandedProviders((prev) => ({ ...prev, [providerId]: !isExpanded }))}
                                className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <img src={`/models/${entry.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                    <span className="text-sm font-medium text-zinc-200">{entry.providerLabel}</span>
                                    {hasKey ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                            Key Configured
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5 font-medium">
                                            API Key Required
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">
                                        {activeCount} / {allModelsForProvider.length} active
                                    </span>
                                    <FiChevronDown className={`transition-transform duration-200 text-zinc-400 ${isExpanded ? 'rotate-180' : ''}`} size={16} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 py-2 border-t border-white/5 bg-[#101012] flex flex-col gap-1">
                                    {!hasKey ? (
                                        <div className="py-3 text-xs text-zinc-500 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <FiAlertCircle size={14} className="text-amber-400 shrink-0" />
                                                <span>Configure your API key for {entry.providerLabel} to enable models.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setActiveSubTab('providers')}
                                                className="px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer shrink-0"
                                            >
                                                Configure Key
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {allModelsForProvider.map((model) => {
                                                const activeCustomRecord = customModels.find((cm) => cm.modelId === model.modelId)
                                                const isModelActive = Boolean(activeCustomRecord)
                                                const isToggling = togglingModelId === model.modelId
                                                const contextTier = getContextTier(model.contextTokens ?? 0)
                                                const contextLabel = formatContextWindow(model.contextTokens ?? 0)

                                                return (
                                                    <div
                                                        key={model.modelId}
                                                        onClick={() => !model.isUserCustom && !isToggling && handleToggleBYOKModel(model)}
                                                        className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 transition-opacity ${model.isUserCustom ? '' : 'cursor-pointer'} ${isModelActive ? 'opacity-100' : 'opacity-50'}`}
                                                    >
                                                        <div className="flex flex-col min-w-0 mr-4">
                                                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                                                                <span className="truncate">{model.name}</span>
                                                                <span className="text-[10px] text-zinc-500 font-mono">({model.modelId})</span>
                                                                {model.isUserCustom && (
                                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium shrink-0">
                                                                        Custom
                                                                    </span>
                                                                )}
                                                                <span className="inline-flex items-center gap-2 shrink-0">
                                                                    {model.isReasoning && (
                                                                        <span className="inline-flex items-center text-purple-400" title="Reasoning" aria-label="Reasoning">
                                                                            <TbBrain size={13} />
                                                                        </span>
                                                                    )}
                                                                    {model.contextTokens && (
                                                                        <span className={`inline-flex items-center ${CONTEXT_TIER_CLASS[contextTier]}`} title={`Context: ${contextLabel}`} aria-label={`Context: ${contextLabel}`}>
                                                                            <FiDatabase size={12} />
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {model.description && (
                                                                <span className="text-[11px] text-zinc-500 mt-0.5 truncate">{model.description}</span>
                                                            )}
                                                        </div>

                                                        {model.isUserCustom ? (
                                                            <button
                                                                type="button"
                                                                disabled={isToggling}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (!isToggling) handleToggleBYOKModel(model)
                                                                }}
                                                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                                                title="Delete custom model"
                                                            >
                                                                <FiTrash2 size={14} />
                                                            </button>
                                                        ) : (
                                                            <div
                                                                className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${isModelActive ? 'bg-purple-600' : 'bg-zinc-700'}`}
                                                            >
                                                                <div
                                                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isModelActive ? 'translate-x-4' : 'translate-x-0'}`}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
