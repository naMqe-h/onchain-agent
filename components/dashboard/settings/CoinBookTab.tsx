'use client'

import { useState, useEffect, useRef } from 'react'
import { FiPlus, FiDisc, FiCopy, FiCheck, FiTrash2, FiChevronDown } from 'react-icons/fi'
import { User } from '@supabase/supabase-js'
import {
    listCoinBook,
    createCoinBookEntry,
    deleteCoinBookEntry,
} from '../../../app/actions/coinBook'
import { isSupportedNetwork, normalizeNetworkId } from '../../../lib/web3/config'
import { PublicCoinBookEntry } from '@/types'

interface CoinBookTabProps {
    user: User | null
}

type ChainOption = {
    id: string
    label: string
    icon: string
}

const MAINNET_CHAINS: ChainOption[] = [
    { id: 'robinhood-mainnet', label: 'Robinhood', icon: '/chains/robinhood.png' },
    { id: 'ethereum', label: 'Ethereum Mainnet', icon: '/chains/ethereum.png' },
    { id: 'polygon', label: 'Polygon Mainnet', icon: '/chains/polygon.png' },
    { id: 'base', label: 'Base', icon: '/chains/base.png' },
    { id: 'arbitrum', label: 'Arbitrum', icon: '/chains/arbitrum.png' },
    { id: 'bsc', label: 'BNB Smart Chain', icon: '/chains/bnb.png' },
    { id: 'solana', label: 'Solana', icon: '/chains/solana.png' },
]

function getInitialChain(userNetwork?: string | null): string {
    const norm = normalizeNetworkId(userNetwork)
    if (norm === 'robinhood-testnet') return 'robinhood-mainnet'
    if (norm === 'ethereum-sepolia') return 'ethereum'
    const found = MAINNET_CHAINS.find((c) => c.id === norm)
    return found ? found.id : 'robinhood-mainnet'
}

export default function CoinBookTab({ user }: CoinBookTabProps) {
    const defaultChain = getInitialChain(user?.user_metadata?.activeNetwork)

    const [entries, setEntries] = useState<PublicCoinBookEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [address, setAddress] = useState('')
    const [selectedChain, setSelectedChain] = useState<string>(defaultChain)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState<PublicCoinBookEntry | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchEntries = async () => {
        setIsLoading(true)
        setError('')
        try {
            const data = await listCoinBook()
            setEntries(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load coin book')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries()
        setShowForm(false)
        setError('')
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const resetForm = () => {
        setAddress('')
        setSelectedChain(defaultChain)
        setIsDropdownOpen(false)
        setShowForm(false)
    }

    const openCreate = () => {
        setAddress('')
        setSelectedChain(defaultChain)
        setIsDropdownOpen(false)
        setError('')
        setShowForm(true)
    }

    const handleCopy = (id: string, value: string) => {
        navigator.clipboard.writeText(value)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!address.trim() || !selectedChain) return

        setIsSubmitting(true)
        setError('')
        try {
            const result = await createCoinBookEntry(address.trim(), selectedChain)
            if (result.error) {
                setError(result.error)
                return
            }
            resetForm()
            await fetchEntries()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save coin entry')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (entry: PublicCoinBookEntry) => {
        setIsDeleting(true)
        setError('')
        try {
            const result = await deleteCoinBookEntry(entry.id)
            if (result.error) {
                setError(result.error)
                return
            }
            setDeleteConfirmation(null)
            await fetchEntries()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete coin entry')
        } finally {
            setIsDeleting(false)
        }
    }

    const selectedChainObj = MAINNET_CHAINS.find((c) => c.id === selectedChain) || MAINNET_CHAINS[0]

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="min-w-0">
                    <h2 className="text-lg font-medium text-zinc-100">Coin Book</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        Private saved tokens for fast agent resolution.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-white/5 shrink-0"
                    >
                        <FiPlus size={14} />
                        <span>Add Token</span>
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl shrink-0">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pt-4 pr-1">
                {showForm ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 max-w-md bg-[#1c1c1f]/40 p-4 border border-white/5 rounded-2xl"
                    >
                        <h3 className="text-sm font-semibold text-zinc-300">
                            Add Saved Token
                        </h3>

                        <div className="flex flex-col gap-1.5" ref={dropdownRef}>
                            <label className="text-xs text-zinc-500">Chain</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between bg-[#141416] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 hover:border-white/20 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                            src={selectedChainObj.icon}
                                            alt={selectedChainObj.label}
                                            className="w-5 h-5 rounded-full object-contain shrink-0"
                                        />
                                        <span className="truncate">{selectedChainObj.label}</span>
                                    </div>
                                    <FiChevronDown
                                        className={`text-zinc-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1c1c1f] border border-white/10 rounded-xl shadow-2xl py-1 z-50 flex flex-col max-h-60 overflow-y-auto">
                                        {MAINNET_CHAINS.map((chain) => (
                                            <button
                                                key={chain.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedChain(chain.id)
                                                    setIsDropdownOpen(false)
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${selectedChain === chain.id
                                                    ? 'bg-white/10 text-zinc-100 font-medium'
                                                    : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img
                                                        src={chain.icon}
                                                        alt={chain.label}
                                                        className="w-5 h-5 rounded-full object-contain shrink-0"
                                                    />
                                                    <span className="truncate">{chain.label}</span>
                                                </div>
                                                {selectedChain === chain.id && (
                                                    <FiCheck size={14} className="text-indigo-400 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-zinc-500">Token Address</label>
                            <input
                                type="text"
                                required
                                placeholder="0x... or token contract address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify & Add Token'}
                            </button>
                        </div>
                    </form>
                ) : isLoading ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Loading coin book...
                    </div>
                ) : entries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center">
                        <FiDisc size={40} className="mb-3 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-400">No Saved Tokens</p>
                        <p className="text-xs text-zinc-600 mt-1 mb-4">
                            Save token contract addresses to speed up token lookup and swaps in chat.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {entries.map((entry) => {
                            const rawChain = entry.chain || 'ethereum'
                            const normChain = isSupportedNetwork(rawChain)
                                ? normalizeNetworkId(rawChain)
                                : rawChain

                            const chainObj = MAINNET_CHAINS.find(
                                (c) => c.id === normChain || c.id === rawChain || c.id.toLowerCase() === rawChain.toLowerCase()
                            ) || {
                                id: rawChain,
                                label: rawChain.charAt(0).toUpperCase() + rawChain.slice(1),
                                icon: '/chains/ethereum.png',
                            }

                            return (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-3.5 bg-[#1c1c1f]/30 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {entry.imageUrl ? (
                                            <img
                                                src={entry.imageUrl}
                                                alt={entry.symbol}
                                                className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                                                onError={(e) => {
                                                    ; (e.target as HTMLElement).style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                                {entry.symbol.slice(0, 3)}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-semibold text-zinc-200 truncate">
                                                    {entry.symbol}
                                                </span>
                                                <span className="text-xs text-zinc-400 truncate">
                                                    {entry.name}
                                                </span>
                                                <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-300 rounded-md shrink-0">
                                                    <img
                                                        src={chainObj.icon}
                                                        alt={chainObj.label}
                                                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                                                    />
                                                    <span>{chainObj.label}</span>
                                                </div>
                                            </div>

                                            <div className="flex md:hidden items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-300 rounded-md shrink-0 w-fit">
                                                <img
                                                    src={chainObj.icon}
                                                    alt={chainObj.label}
                                                    className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                                                />
                                                <span>{chainObj.label}</span>
                                            </div>

                                            <span className="text-xs text-zinc-500 font-mono truncate">
                                                {entry.address}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => handleCopy(entry.id, entry.address)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                            title="Copy address"
                                        >
                                            {copiedId === entry.id ? (
                                                <FiCheck size={14} className="text-emerald-400" />
                                            ) : (
                                                <FiCopy size={14} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmation(entry)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {deleteConfirmation && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-zinc-100">Delete Saved Token</h3>
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to delete{' '}
                            <span className="text-zinc-200 font-medium">{deleteConfirmation.symbol} ({deleteConfirmation.name})</span> from
                            your coin book? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmation(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteConfirmation)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
