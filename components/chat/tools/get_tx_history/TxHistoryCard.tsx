'use client'

import { FiExternalLink, FiArrowUpRight, FiArrowDownLeft, FiRefreshCw, FiCpu, FiCheck, FiCopy } from 'react-icons/fi'
import { useState } from 'react'
import {
    EMPTY_VALUE,
    formatShortAddress,
    formatRelativeTime,
} from '../../../../lib/format'
import {
    getExplorerBaseUrl,
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '../../../../lib/web3/config'
import { TxHistoryData } from '@/types'

interface TxHistoryCardProps {
    data: TxHistoryData
}

export default function TxHistoryCard({ data }: TxHistoryCardProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    if (!data.transactions?.length) {
        const network = normalizeNetworkId(data.network)
        const base = getExplorerBaseUrl(network)
        const networkLabel = getNetworkShortLabel(network)

        return (
            <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl my-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                            Transaction History
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                            {formatShortAddress(data.address)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                        <img
                            src={getNetworkIconSrc(network)}
                            alt={networkLabel}
                            className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            {networkLabel || EMPTY_VALUE}
                        </span>
                    </div>
                </div>
                <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500">No transactions found on the active network.</p>
                </div>
            </div>
        )
    }

    const network = normalizeNetworkId(data.network)
    const base = getExplorerBaseUrl(network)
    const networkLabel = getNetworkShortLabel(network)
    const nativeSymbol = data.symbol

    const handleCopy = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedKey(key)
            setTimeout(() => setCopiedKey(null), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    return (
        <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        Transaction History
                    </span>
                    <a
                        href={`${base}/address/${data.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-zinc-400 hover:text-purple-400 flex items-center gap-1 transition-colors w-fit"
                        title={data.address}
                    >
                        <span>{formatShortAddress(data.address)}</span>
                        <FiExternalLink size={11} className="opacity-60 shrink-0" />
                    </a>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                    <img
                        src={getNetworkIconSrc(network)}
                        alt={networkLabel}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {networkLabel || EMPTY_VALUE}
                    </span>
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {data.transactions.map((tx) => {
                    const isOutgoing = tx.from.toLowerCase() === data.address.toLowerCase()
                    const isIncoming = tx.to?.toLowerCase() === data.address.toLowerCase()
                    const isSwap = tx.method === 'swap' || tx.method?.toLowerCase().includes('swap')
                    const isTransfer = tx.method === 'transfer' || tx.method === 'transferFrom'

                    let title = 'Transaction'
                    let IconComponent = FiCpu
                    let iconColorClass = 'text-blue-400 bg-blue-500/10'

                    if (isSwap) {
                        title = 'Swap'
                        IconComponent = FiRefreshCw
                        iconColorClass = 'text-amber-400 bg-amber-500/10'
                    } else if (isTransfer) {
                        if (isOutgoing) {
                            title = 'Send Token'
                            IconComponent = FiArrowUpRight
                            iconColorClass = 'text-zinc-400 bg-zinc-500/10'
                        } else {
                            title = 'Receive Token'
                            IconComponent = FiArrowDownLeft
                            iconColorClass = 'text-emerald-400 bg-emerald-500/10'
                        }
                    } else if (tx.method) {
                        title = tx.method.charAt(0).toUpperCase() + tx.method.slice(1)
                        IconComponent = FiCpu
                        iconColorClass = 'text-indigo-400 bg-indigo-500/10'
                    } else {
                        if (isOutgoing) {
                            title = 'Send'
                            IconComponent = FiArrowUpRight
                            iconColorClass = 'text-zinc-400 bg-zinc-500/10'
                        } else if (isIncoming) {
                            title = 'Receive'
                            IconComponent = FiArrowDownLeft
                            iconColorClass = 'text-emerald-400 bg-emerald-500/10'
                        }
                    }

                    const txCopied = copiedKey === tx.hash

                    return (
                        <div
                            key={tx.hash}
                            className="flex items-center justify-between gap-3 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:border-zinc-700/40 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2.5 rounded-lg shrink-0 ${iconColorClass}`}>
                                    <IconComponent size={16} />
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-semibold text-zinc-200 truncate">
                                        {title}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <span>{formatRelativeTime(tx.timestamp)}</span>
                                        <span>•</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(tx.hash, tx.hash)}
                                            className="font-mono hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                                            title="Copy Tx Hash"
                                        >
                                            <span>{formatShortAddress(tx.hash)}</span>
                                            {txCopied ? (
                                                <FiCheck className="text-emerald-400 size-3 shrink-0" />
                                            ) : (
                                                <FiCopy className="size-3 opacity-60 shrink-0" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                                {tx.value !== '0' ? (
                                    <span className={`text-sm font-bold ${isIncoming && !isSwap ? 'text-emerald-400' : 'text-zinc-100'}`}>
                                        {isIncoming && !isSwap ? '+' : isOutgoing ? '-' : ''}
                                        {Number(tx.value) < 0.0001 ? Number(tx.value).toFixed(6) : Number(tx.value).toFixed(4)}{' '}
                                        <span className="text-[10px] font-semibold text-zinc-400">{nativeSymbol}</span>
                                    </span>
                                ) : (
                                    <span className="text-xs text-zinc-500 font-semibold">—</span>
                                )}

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-[10px] font-medium capitalize ${tx.status === 'success'
                                            ? 'text-emerald-400'
                                            : tx.status === 'pending'
                                                ? 'text-amber-400'
                                                : 'text-rose-400'
                                            }`}
                                    >
                                        {tx.status}
                                    </span>
                                    <a
                                        href={`${base}/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-zinc-500 hover:text-purple-400 transition-colors cursor-pointer"
                                        title="View on Explorer"
                                    >
                                        <FiExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {(data.totalCount ?? 0) > (data.returnedCount ?? 0) && (
                <p className="pt-3 mt-1 text-[11px] text-zinc-500 border-t border-zinc-800/60">
                    Showing recent {data.returnedCount} of {data.totalCount} transactions
                </p>
            )}
        </div>
    )
}
