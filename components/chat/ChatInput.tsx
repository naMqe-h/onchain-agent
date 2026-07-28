import { useState, useEffect, useRef } from 'react'
import { FiArrowUp, FiChevronUp, FiCreditCard, FiSquare } from 'react-icons/fi'
import { TbBrain } from 'react-icons/tb'
import { motion } from 'framer-motion'
import { slideInUp } from '../../lib/motion'
import { useWalletStore } from '../../hooks/useWalletStore'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { DEFAULT_MODEL_ID } from '../../lib/models'
import { useModelsStore } from '../../hooks/useModelsStore'
import {
    NETWORK_OPTIONS,
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '../../lib/web3/config'

interface ChatInputProps {
    input: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    onStop?: () => void
    isBusy?: boolean
    selectedModel: string
    onModelChange: (model: string) => void
    selectedNetwork?: string
    onNetworkChange?: (network: string) => void
    enabledModels?: string[]
    isAuthenticated: boolean
    isExpanded?: boolean
}

function shortAddress(address: string) {
    if (address.length < 10) return address
    return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function ChatInput({
    input,
    handleInputChange,
    handleSubmit,
    onStop,
    isBusy,
    selectedModel,
    onModelChange,
    selectedNetwork,
    onNetworkChange,
    enabledModels,
    isAuthenticated,
    isExpanded
}: ChatInputProps) {
    const [isModelOpen, setIsModelOpen] = useState(false)
    const [isWalletOpen, setIsWalletOpen] = useState(false)
    const [isNetworkOpen, setIsNetworkOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const openAuthModal = useAuthModalStore(s => s.open)

    const wallets = useWalletStore(s => s.wallets)
    const selectedAddress = useWalletStore(s => s.selectedAddress)
    const isLoadingWallets = useWalletStore(s => s.isLoading)
    const setSelectedAddress = useWalletStore(s => s.setSelectedAddress)
    const openSettings = useSettingsStore(s => s.openSettings)

    const selectedWallet = wallets.find(
        w => w.address.toLowerCase() === selectedAddress?.toLowerCase()
    )

    const currentNetworkId = normalizeNetworkId(selectedNetwork)

    useEffect(() => {
        if (!isBusy) {
            inputRef.current?.focus()
        }
    }, [isBusy])

    const catalog = useModelsStore(s => s.models)

    const models = catalog.filter(
        m => !enabledModels || enabledModels.length === 0 || enabledModels.includes(m.id) || m.id === selectedModel
    )

    const activeModel = catalog.find(m => m.id === selectedModel) || models[0] || {
        id: DEFAULT_MODEL_ID,
        name: selectedModel,
        shortName: selectedModel,
        provider: '',
        isReasoning: false,
        latencyMs: 0,
        contextTokens: 0,
    }

    return (
        <motion.div
            variants={slideInUp}
            initial="initial"
            animate="animate"
            className="px-4 pt-3 pb-3 bg-transparent"
        >
            <div className={`${isExpanded ? 'max-w-4xl' : 'max-w-3xl'} mx-auto flex flex-col gap-1.5 transition-all duration-300`}>
                <form onSubmit={handleSubmit} data-tour="chat-input" className="flex gap-3 bg-[#1e1e20] rounded-full px-4 py-3 items-center shadow-lg border border-white/5 relative z-10">
                    <input
                        ref={inputRef}
                        type="text"
                        maxLength={4000}
                        value={isAuthenticated ? input : ''}
                        onChange={isAuthenticated ? handleInputChange : undefined}
                        disabled={isBusy}
                        readOnly={!isAuthenticated}
                        onClick={!isAuthenticated ? () => openAuthModal() : undefined}
                        onFocus={!isAuthenticated ? () => openAuthModal() : undefined}
                        placeholder={isAuthenticated ? (isBusy ? 'Agent is working…' : 'Ask Agent') : 'Sign in to start chatting…'}
                        className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-50 text-[15px] ml-2 min-w-0 cursor-text"
                    />

                    {isBusy && onStop ? (
                        <button
                            type="button"
                            onClick={onStop}
                            title="Stop response generation"
                            className="bg-zinc-200 hover:bg-white text-black rounded-full p-2 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                            <FiSquare size={16} className="fill-current" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isBusy || !input.trim() || input.length > 4000 || !isAuthenticated}
                            className="bg-zinc-200 hover:bg-white text-black rounded-full p-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <FiArrowUp size={20} />
                        </button>
                    )}
                </form>

                {isAuthenticated && (
                    <div className="flex items-center justify-between gap-2 px-1 z-20 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                            <div className="relative min-w-0">
                                <button
                                    type="button"
                                    data-tour="wallet-button"
                                    onClick={() => {
                                        setIsWalletOpen(!isWalletOpen)
                                        setIsModelOpen(false)
                                        setIsNetworkOpen(false)
                                    }}
                                    disabled={isBusy || isLoadingWallets}
                                    className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <FiCreditCard size={12} className="shrink-0 opacity-70" />
                                    {isLoadingWallets ? (
                                        <span>Loading wallets…</span>
                                    ) : selectedWallet ? (
                                        <>
                                            <span className="font-medium text-zinc-400 truncate max-w-20 sm:max-w-30">{selectedWallet.name}</span>
                                            <span className="text-zinc-600 font-mono shrink-0 hidden sm:inline">{shortAddress(selectedWallet.address)}</span>
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
                                        <div className="absolute bottom-full mb-1.5 left-0 w-72 max-w-[calc(100vw-32px)] bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 flex flex-col max-h-56">
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

                            <div className="relative min-w-0 shrink-0">
                                <button
                                    type="button"
                                    data-tour="network-selector"
                                    onClick={() => {
                                        setIsNetworkOpen(!isNetworkOpen)
                                        setIsWalletOpen(false)
                                        setIsModelOpen(false)
                                    }}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                                    title="Active chain for chat"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={getNetworkIconSrc(currentNetworkId)}
                                        alt=""
                                        className="w-3.5 h-3.5 object-contain shrink-0 rounded-md"
                                        aria-hidden
                                    />
                                    <span className="font-medium text-zinc-400 truncate max-w-24 sm:max-w-none">{getNetworkShortLabel(currentNetworkId)}</span>
                                    <FiChevronUp className={`shrink-0 transition-transform duration-200 ${isNetworkOpen ? 'rotate-180' : ''}`} size={12} />
                                </button>

                                {isNetworkOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsNetworkOpen(false)} />
                                        <div className="absolute bottom-full mb-1.5 left-0 w-64 max-w-[calc(100vw-32px)] bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 flex flex-col">
                                            <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-white/5 mb-1 shrink-0">
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Chain</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsNetworkOpen(false)
                                                        openSettings('network')
                                                    }}
                                                    className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium cursor-pointer"
                                                >
                                                    Default
                                                </button>
                                            </div>
                                            <div className="overflow-y-auto max-h-57.5">
                                                {NETWORK_OPTIONS.map((opt) => {
                                                    const active = opt.id === currentNetworkId
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                onNetworkChange?.(opt.id)
                                                                setIsNetworkOpen(false)
                                                            }}
                                                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${active ? 'bg-white/5 text-zinc-100' : 'text-zinc-400 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={getNetworkIconSrc(opt.id)}
                                                                    alt=""
                                                                    className="w-4 h-4 object-contain shrink-0 rounded-md"
                                                                    aria-hidden
                                                                />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className={`font-medium truncate ${active ? 'text-zinc-100' : 'text-zinc-200'}`}>
                                                                        {opt.label}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-500">
                                                                        Chain ID: {opt.chainId}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {isAuthenticated && input.length > 2000 && (
                                <span className={`text-[11px] font-mono transition-colors ${input.length >= 3800
                                    ? 'text-rose-400 font-semibold'
                                    : input.length >= 3600
                                        ? 'text-amber-400 font-medium'
                                        : 'text-zinc-500'
                                    }`}>
                                    {input.length} / 4000
                                </span>
                            )}
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    data-tour="model-selector"
                                    onClick={() => {
                                        setIsModelOpen(!isModelOpen)
                                        setIsWalletOpen(false)
                                        setIsNetworkOpen(false)
                                    }}
                                    disabled={isBusy}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                                    title={activeModel.isReasoning ? 'Reasoning model (thought process)' : undefined}
                                >
                                    {activeModel.icon && (
                                        <img src={`/models/${activeModel.icon}`} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                                    )}
                                    <span>{activeModel.shortName}</span>
                                    {activeModel.isReasoning && (
                                        <TbBrain size={13} className="text-purple-400 shrink-0" aria-hidden />
                                    )}
                                    <FiChevronUp className={`transition-transform duration-200 ${isModelOpen ? 'rotate-180' : ''}`} size={12} />
                                </button>

                                {isModelOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsModelOpen(false)} />
                                        <div className="absolute bottom-full mb-1.5 right-0 w-64 bg-[#1f1f22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 flex flex-col">
                                            <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-white/5 mb-1 shrink-0">
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
                                            <div className="overflow-y-auto max-h-57.5">
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
                                                            {m.icon && (
                                                                <img src={`/models/${m.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                                            )}
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
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>

    )
}
