import { FiChevronDown, FiCheck, FiKey } from 'react-icons/fi'
import type { ChatModelOption } from '../../../../types'

interface DefaultModelSelectorProps {
    selectedDefaultModel: string
    activeDefaultModel?: ChatModelOption
    isUpdating: boolean
    isDefaultOpen: boolean
    setIsDefaultOpen: (open: boolean) => void
    appModels: ChatModelOption[]
    userModels: ChatModelOption[]
    enabledModels: string[]
    handleSetDefaultModel: (modelId: string) => void
}

export default function DefaultModelSelector({
    selectedDefaultModel,
    activeDefaultModel,
    isUpdating,
    isDefaultOpen,
    setIsDefaultOpen,
    appModels,
    userModels,
    enabledModels,
    handleSetDefaultModel,
}: DefaultModelSelectorProps) {
    return (
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
                    <span className="flex items-center gap-2 min-w-0">
                        {activeDefaultModel?.icon ? (
                            <img src={`/models/${activeDefaultModel.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                        ) : (
                            <FiKey size={14} className="text-purple-400 shrink-0" />
                        )}
                        <span className="truncate">
                            {activeDefaultModel ? activeDefaultModel.name : 'Select model'}
                        </span>
                    </span>
                    <FiChevronDown className={`transition-transform duration-200 text-zinc-400 ${isDefaultOpen ? 'rotate-180' : ''}`} size={16} />
                </button>

                {isDefaultOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDefaultOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-60 overflow-y-auto">
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                                App Models
                            </div>
                            {appModels.filter((m) => enabledModels.includes(m.id)).map((m) => {
                                const isSelected = selectedDefaultModel === m.id
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            handleSetDefaultModel(m.id)
                                            setIsDefaultOpen(false)
                                        }}
                                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            {m.icon && (
                                                <img src={`/models/${m.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                            )}
                                            <span className="truncate">{m.name}</span>
                                        </span>
                                        {isSelected && <FiCheck size={14} className="text-purple-400 shrink-0" />}
                                    </button>
                                )
                            })}

                            {userModels.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-900/40 border-t border-white/5">
                                        User Models
                                    </div>
                                    {userModels.filter((m) => enabledModels.includes(m.id)).map((m) => {
                                        const isSelected = selectedDefaultModel === m.id
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    handleSetDefaultModel(m.id)
                                                    setIsDefaultOpen(false)
                                                }}
                                                className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-white/5 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                            >
                                                <span className="truncate flex items-center gap-2">
                                                    {m.icon ? (
                                                        <img src={`/models/${m.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                                    ) : (
                                                        <FiKey size={13} className="text-purple-400 shrink-0" />
                                                    )}
                                                    <span className="truncate">{m.name}</span>
                                                </span>
                                                {isSelected && <FiCheck size={14} className="text-purple-400 shrink-0" />}
                                            </button>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
