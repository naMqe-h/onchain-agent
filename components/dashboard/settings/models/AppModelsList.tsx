import { FiZap, FiDatabase } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'
import type { ChatModelOption, LatencyTier, ContextTier } from '../../../../types'
import { getLatencyTier, getContextTier, formatContextWindow } from '../../../../lib/models'

interface AppModelsListProps {
    appModels: ChatModelOption[]
    enabledModels: string[]
    handleToggleModel: (modelId: string) => void
    LATENCY_TIER_CLASS: Record<LatencyTier, string>
    CONTEXT_TIER_CLASS: Record<ContextTier, string>
}

export default function AppModelsList({
    appModels,
    enabledModels,
    handleToggleModel,
    LATENCY_TIER_CLASS,
    CONTEXT_TIER_CLASS,
}: AppModelsListProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>App Models (System)</span>
                <span className="text-[10px] font-normal text-zinc-500">Keys provided by platform</span>
            </span>
            <div className="flex flex-col bg-[#141416]/50 rounded-xl border border-white/5 px-3.5 py-1">
                {appModels.map((m) => {
                    const isEnabled = enabledModels.includes(m.id)
                    const latencyTier = getLatencyTier(m.latencyMs ?? 0)
                    const contextTier = getContextTier(m.contextTokens ?? 0)
                    const contextLabel = formatContextWindow(m.contextTokens ?? 0)
                    return (
                        <div
                            key={m.id}
                            onClick={() => handleToggleModel(m.id)}
                            className={`flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 transition-opacity cursor-pointer ${isEnabled ? 'opacity-100' : 'opacity-50'}`}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200 select-none flex-1 mr-4 min-w-0">
                                {m.icon && (
                                    <img src={`/models/${m.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                )}
                                <span className="truncate">{m.name}</span>
                                <span className="inline-flex items-center gap-2 shrink-0">
                                    {m.isReasoning && (
                                        <span className="inline-flex items-center text-purple-400" title="Reasoning" aria-label="Reasoning">
                                            <TbBrain size={13} />
                                        </span>
                                    )}
                                    <span className={`inline-flex items-center ${LATENCY_TIER_CLASS[latencyTier]}`} title={`Latency: ${latencyTier}`} aria-label={`Latency: ${latencyTier}`}>
                                        <FiZap size={12} />
                                    </span>
                                    <span className={`inline-flex items-center ${CONTEXT_TIER_CLASS[contextTier]}`} title={`Context: ${contextLabel}`} aria-label={`Context: ${contextLabel}`}>
                                        <FiDatabase size={12} />
                                    </span>
                                </span>
                            </div>
                            <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 ${isEnabled ? 'bg-purple-600' : 'bg-zinc-700'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
