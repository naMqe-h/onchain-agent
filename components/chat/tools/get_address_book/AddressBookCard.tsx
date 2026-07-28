'use client'

import { useState } from 'react'
import { FiBookOpen, FiCopy, FiCheck, FiExternalLink, FiUser } from 'react-icons/fi'
import { formatShortAddress } from '../../../../lib/format'
import { getExplorerBaseUrl, normalizeNetworkId } from '../../../../lib/web3/config'
import { AddressBookData } from '../../../../types'

interface AddressBookCardProps {
    data: AddressBookData
    activeNetwork?: string
}

export default function AddressBookCard({ data, activeNetwork }: AddressBookCardProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const network = normalizeNetworkId(activeNetwork)
    const baseExplorer = getExplorerBaseUrl(network)

    const handleCopy = async (address: string, index: number) => {
        try {
            await navigator.clipboard.writeText(address)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
        }
    }

    const entries = data.entries ?? []

    return (
        <div className="w-full max-w-md bg-[#171719]/90 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-blue-500/40 my-2">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FiBookOpen size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Address Book</h3>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            {entries.length} {entries.length === 1 ? 'contact' : 'contacts'} saved
                        </p>
                    </div>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500">No saved entries in your address book.</p>
                </div>
            ) : (
                <div className="my-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                    {entries.map((entry, index) => {
                        const isCopied = copiedIndex === index
                        return (
                            <div
                                key={`${entry.name}-${entry.address}-${index}`}
                                className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:border-zinc-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-zinc-800 text-blue-400 shrink-0">
                                        <FiUser size={15} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-zinc-200 truncate">
                                            {entry.name}
                                        </span>
                                        <span className="text-xs font-mono text-zinc-500 truncate">
                                            {formatShortAddress(entry.address)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(entry.address, index)}
                                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                        title="Copy Address"
                                    >
                                        {isCopied ? (
                                            <FiCheck size={14} className="text-emerald-400" />
                                        ) : (
                                            <FiCopy size={14} />
                                        )}
                                    </button>
                                    {baseExplorer && (
                                        <a
                                            href={`${baseExplorer}/address/${entry.address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer"
                                            title="View on Explorer"
                                        >
                                            <FiExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

