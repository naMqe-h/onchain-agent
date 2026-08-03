import { FiChevronDown, FiCheck } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'

interface ProviderItem {
    id: string
    label: string
    icon: string
    placeholder: string
}

interface AdvancedCustomModelFormProps {
    showManualForm: boolean
    setShowManualForm: (show: boolean) => void
    newModelId: string
    setNewModelId: (val: string) => void
    newModelName: string
    setNewModelName: (val: string) => void
    newModelProvider: string
    setNewModelProvider: (val: string) => void
    isCustomModelProviderOpen: boolean
    setIsCustomModelProviderOpen: (open: boolean) => void
    newModelReasoning: boolean
    setNewModelReasoning: (val: boolean) => void
    isAddingModel: boolean
    activeProviders: Set<string>
    KNOWN_PROVIDERS: ProviderItem[]
    currentCustomModelProviderInfo?: ProviderItem
    handleAddManualCustomModel: (e: React.FormEvent) => void
}

export default function AdvancedCustomModelForm({
    showManualForm,
    setShowManualForm,
    newModelId,
    setNewModelId,
    newModelName,
    setNewModelName,
    newModelProvider,
    setNewModelProvider,
    isCustomModelProviderOpen,
    setIsCustomModelProviderOpen,
    newModelReasoning,
    setNewModelReasoning,
    isAddingModel,
    activeProviders,
    KNOWN_PROVIDERS,
    currentCustomModelProviderInfo,
    handleAddManualCustomModel,
}: AdvancedCustomModelFormProps) {
    return (
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-1"
            >
                <span className="flex items-center gap-2">
                    <span>Add Custom Model ID (Advanced)</span>
                </span>
                <FiChevronDown className={`transition-transform duration-200 ${showManualForm ? 'rotate-180' : ''}`} size={14} />
            </button>

            {showManualForm && (
                <form onSubmit={handleAddManualCustomModel} className="p-4 bg-[#141416] border border-white/5 rounded-xl flex flex-col gap-3 mt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-zinc-400">Model ID (e.g. gpt-4o, claude-3-5-sonnet)</label>
                            <input
                                type="text"
                                placeholder="Model ID"
                                value={newModelId}
                                onChange={(e) => setNewModelId(e.target.value)}
                                className="bg-[#1c1c1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-zinc-400">Display Name</label>
                            <input
                                type="text"
                                placeholder="Display name"
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                className="bg-[#1c1c1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1 min-w-44">
                                <label className="text-[11px] text-zinc-400">Provider</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomModelProviderOpen(!isCustomModelProviderOpen)}
                                        className="w-full flex items-center justify-between bg-[#1c1c1f] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            {currentCustomModelProviderInfo?.icon && (
                                                <img src={`/models/${currentCustomModelProviderInfo.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                            )}
                                            <span className="truncate">{currentCustomModelProviderInfo?.label || 'Select Provider'}</span>
                                        </span>
                                        <FiChevronDown className={`transition-transform duration-200 text-zinc-400 ${isCustomModelProviderOpen ? 'rotate-180' : ''}`} size={14} />
                                    </button>

                                    {isCustomModelProviderOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsCustomModelProviderOpen(false)} />
                                            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-56 overflow-y-auto">
                                                {KNOWN_PROVIDERS.map((p) => {
                                                    const hasKey = activeProviders.has(p.id)
                                                    const isSelected = newModelProvider === p.id
                                                    return (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            disabled={!hasKey}
                                                            onClick={() => {
                                                                if (hasKey) {
                                                                    setNewModelProvider(p.id)
                                                                    setIsCustomModelProviderOpen(false)
                                                                }
                                                            }}
                                                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'} ${!hasKey ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        >
                                                            <span className="truncate flex items-center gap-2">
                                                                {p.icon && (
                                                                    <img src={`/models/${p.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                                                )}
                                                                <span className="truncate">
                                                                    {p.label} {!hasKey ? '(key required)' : ''}
                                                                </span>
                                                            </span>
                                                            {isSelected && <FiCheck size={14} className="text-purple-400 shrink-0" />}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div
                                onClick={() => setNewModelReasoning(!newModelReasoning)}
                                className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer mt-4 select-none group shrink-0"
                            >
                                <div className={`w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center ${newModelReasoning ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#1c1c1f] border-white/15 group-hover:border-white/30'}`}>
                                    {newModelReasoning && <FiCheck size={11} strokeWidth={3} />}
                                </div>
                                <span className="flex items-center gap-1.5">
                                    <TbBrain size={14} className={newModelReasoning ? 'text-purple-400' : 'text-zinc-500'} />
                                    <span>Reasoning Model</span>
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isAddingModel || !newModelId.trim() || !activeProviders.has(newModelProvider)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                        >
                            {isAddingModel ? 'Adding...' : 'Add Model'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
