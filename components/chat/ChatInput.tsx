import { useState, useEffect, useRef } from 'react'
import { FiArrowUp, FiChevronUp, FiCreditCard } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'
import { motion } from 'framer-motion'
import { slideInUp } from '../../lib/motion'
import { useWalletStore } from '../../hooks/useWalletStore'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { AVAILABLE_MODELS, ChatModelOption } from '../../lib/models'

interface ChatInputProps {
    input: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    isBusy?: boolean
    selectedModel: string
    onModelChange: (model: string) => void
    enabledModels?: string[]
}

function shortAddress(address: string) {
    if (address.length < 10) return address
    return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function ChatInput({
    input,
    handleInputChange,
    handleSubmit,
    isBusy,
    selectedModel,
    onModelChange,
    enabledModels
}: ChatInputProps) {
    const [isModelOpen, setIsModelOpen] = useState(false)
    const [isWalletOpen, setIsWalletOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const wallets = useWalletStore(s => s.wallets)
    const selectedAddress = useWalletStore(s => s.selectedAddress)
    const isLoadingWallets = useWalletStore(s => s.isLoading)
    const setSelectedAddress = useWalletStore(s => s.setSelectedAddress)
    const openSettings = useSettingsStore(s => s.openSettings)

    const selectedWallet = wallets.find(
        w => w.address.toLowerCase() === selectedAddress?.toLowerCase()
    )

    useEffect(() => {
        if (!isBusy) {
            inputRef.current?.focus()
        }
    }, [isBusy])

    const models = AVAILABLE_MODELS.filter(
        m => !enabledModels || enabledModels.length === 0 || enabledModels.includes(m.id) || m.id === selectedModel
    )

    const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0]

    return (
        <motion.div
            variants={slideInUp}
            initial="initial"
            animate="animate"
            className="px-4 pt-3 pb-3 bg-transparent"
        >
            <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
                <form onSubmit={handleSubmit} className="flex gap-3 bg-[#1e1e20] rounded-full px-4 py-3 items-center shadow-lg border border-white/5 relative z-10">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        disabled={isBusy}
                        placeholder="Ask Agent"
                        className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-50 text-[15px] ml-2 min-w-0"
                    />

                    <button
                        type="submit"
                        disabled={isBusy || !input.trim()}
                        className="bg-zinc-200 hover:bg-white text-black rounded-full p-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <FiArrowUp size={20} />
                    </button>
                </form>

                <div className="flex items-center justify-between gap-2 px-1 z-20 min-w-0">
                    <div className="relative min-w-0">
                        <button
                            type="button"
                            onClick={() => {
                                setIsWalletOpen(!isWalletOpen)
                                setIsModelOpen(false)
                            }}
                            disabled={isBusy || isLoadingWallets}
                            className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <FiCreditCard size={12} className="shrink-0 opacity-70" />
                            {isLoadingWallets ? (
                                <span>Loading wallets…</span>
                            ) : selectedWallet ? (
                                <>
                                    <span className="font-medium text-zinc-400 truncate max-w-[140px]">{selectedWallet.name}</span>
                                    <span className="text-zinc-600 font-mono shrink-0">{shortAddress(selectedWallet.address)}</span>
                                </>
                            ) : wallets.length === 0 ? (
                                <span>No wallet</span>
                            ) : (
                                <span>Select wallet</span>
                            )}
                            <FiChevronUp className={`shrink-0 transition-transform duration-200 ${isWalletOpen ? 'rotate-180' : ''}`} size={12} />
                        </button>

                        {isWalletOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsWalletOpen(false)} />
                                <div className="absolute bottom-full mb-1.5 left-0 w-72 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-56">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-0.5 shrink-0">
                                        Active wallet for agent
                                    </div>
                                    {wallets.length === 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsWalletOpen(false)
                                                openSettings('wallets')
                                            }}
                                            className="w-full text-left px-3 py-2.5 text-xs text-zinc-400 hover:bg-white/5 cursor-pointer"
                                        >
                                            No wallets yet. Open Settings to create one.
                                        </button>
                                    ) : (
                                        <div className="overflow-y-auto">
                                            {wallets.map((w) => {
                                                const active = w.address.toLowerCase() === selectedAddress?.toLowerCase()
                                                return (
                                                    <button
                                                        key={w.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAddress(w.address)
                                                            setIsWalletOpen(false)
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${active ? 'bg-white/5 text-zinc-100' : 'text-zinc-400 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <span className={`font-medium ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>{w.name}</span>
                                                        <span className="text-[10px] text-zinc-500 font-mono">{shortAddress(w.address)}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModelOpen(!isModelOpen)
                                setIsWalletOpen(false)
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                            title={activeModel.isReasoning ? 'Reasoning model (thought process)' : undefined}
                        >
                            {activeModel.isReasoning && (
                                <TbBrain size={13} className="text-purple-400 shrink-0" aria-hidden />
                            )}
                            <span>{activeModel.shortName}</span>
                            <FiChevronUp className={`transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} size={12} />
                        </button>

                        {isModelOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsModelOpen(false)} />
                                <div className="absolute bottom-full mb-1.5 right-0 w-64 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 flex flex-col">
                                    <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-white/5 mb-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Model</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModelOpen(false)
                                                openSettings('models')
                                            }}
                                            className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium cursor-pointer"
                                        >
                                            Configure
                                        </button>
                                    </div>
                                    {models.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                onModelChange(m.id)
                                                setIsModelOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${selectedModel === m.id
                                                ? 'bg-white/5 text-zinc-100'
                                                : 'text-zinc-400 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="flex items-center gap-1.5 min-w-0">
                                                <span className={`font-medium truncate ${selectedModel === m.id ? 'text-zinc-100' : 'text-zinc-200'}`}>{m.name}</span>
                                                {m.isReasoning && (
                                                    <TbBrain
                                                        size={14}
                                                        className="text-purple-400 shrink-0"
                                                        title="Reasoning model"
                                                        aria-label="Reasoning model"
                                                    />
                                                )}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">
                                                {m.provider}
                                                {m.isReasoning ? ' · Reasoning' : ''}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
