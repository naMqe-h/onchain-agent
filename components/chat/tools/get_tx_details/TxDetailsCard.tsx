'use client'

import { useState } from 'react'
import {
    FiExternalLink,
    FiCopy,
    FiCheck,
    FiCpu,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiAlertCircle
} from 'react-icons/fi'
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
import type { TxDetailsData } from '@/types'

interface TxDetailsCardProps {
    data: TxDetailsData
}

export default function TxDetailsCard({ data }: TxDetailsCardProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const network = normalizeNetworkId(data.network)
    const base = getExplorerBaseUrl(network)
    const networkLabel = getNetworkShortLabel(network)
    const nativeSymbol = data.symbol || 'ETH'

    const handleCopy = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedKey(key)
            setTimeout(() => setCopiedKey(null), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    if (!data.success || !data.tx) {
        return (
            <div className="w-full max-w-3xl bg-[#171719]/90 border border-rose-900/40 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl my-3">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                        <FiAlertCircle className="text-rose-400 size-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                            Transaction Not Found
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full">
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
                <div className="py-4">
                    <p className="text-sm text-zinc-400">{data.error || 'Failed to retrieve transaction details.'}</p>
                    <p className="text-xs font-mono text-zinc-500 mt-2">Hash: {data.hash}</p>
                </div>
            </div>
        )
    }

    const tx = data.tx
    const isStatusSuccess = tx.status === 'success'
    const isStatusPending = tx.status === 'pending'

    const hashCopied = copiedKey === tx.hash
    const fromCopied = copiedKey === `from-${tx.from}`
    const toCopied = copiedKey === `to-${tx.to}`

    return (
        <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <FiCpu size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                            Transaction Details
                        </span>
                        <div className="flex items-center gap-1.5">
                            <a
                                href={`${base}/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-zinc-300 hover:text-purple-400 flex items-center gap-1 transition-colors"
                                title={tx.hash}
                            >
                                <span>{formatShortAddress(tx.hash, 8, 6)}</span>
                                <FiExternalLink size={11} className="opacity-60 shrink-0" />
                            </a>
                            <button
                                type="button"
                                onClick={() => handleCopy(tx.hash, tx.hash)}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                title="Copy Hash"
                            >
                                {hashCopied ? (
                                    <FiCheck className="text-emerald-400 size-3 shrink-0" />
                                ) : (
                                    <FiCopy className="size-3 opacity-60 shrink-0" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${isStatusSuccess
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : isStatusPending
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}
                    >
                        {tx.status}
                    </span>
                    <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full">
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
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Value</span>
                    <span className="text-sm font-bold text-zinc-100 truncate">
                        {Number(tx.value) < 0.0001 && Number(tx.value) > 0 ? Number(tx.value).toFixed(6) : Number(tx.value).toFixed(4)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{nativeSymbol}</span>
                    </span>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Gas Fee</span>
                    <span className="text-sm font-bold text-zinc-200 truncate">
                        {tx.fee ? (
                            <>
                                {Number(tx.fee) < 0.0001 ? Number(tx.fee).toFixed(6) : Number(tx.fee).toFixed(4)}{' '}
                                <span className="text-xs font-normal text-zinc-400">{nativeSymbol}</span>
                            </>
                        ) : (
                            '-'
                        )}
                    </span>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Block</span>
                    <span className="text-sm font-semibold font-mono text-zinc-200 truncate">
                        {tx.blockNumber ? `#${tx.blockNumber}` : 'Pending'}
                    </span>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Time</span>
                    <span className="text-sm font-medium text-zinc-300 truncate">
                        {tx.timestamp ? formatRelativeTime(tx.timestamp) : '-'}
                    </span>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <FiArrowUpRight className="text-zinc-400 size-4 shrink-0" />
                        <span className="text-xs font-medium text-zinc-400">From</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                        <a
                            href={`${base}/address/${tx.from}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-300 hover:text-purple-400 transition-colors flex items-center gap-1"
                        >
                            <span>{formatShortAddress(tx.from)}</span>
                            <FiExternalLink size={10} className="opacity-60" />
                        </a>
                        <button
                            type="button"
                            onClick={() => handleCopy(`from-${tx.from}`, tx.from)}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                            title="Copy From Address"
                        >
                            {fromCopied ? <FiCheck className="text-emerald-400 size-3" /> : <FiCopy className="size-3 opacity-60" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                        <FiArrowDownLeft className="text-zinc-400 size-4 shrink-0" />
                        <span className="text-xs font-medium text-zinc-400">To</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                        {tx.to ? (
                            <>
                                <a
                                    href={`${base}/address/${tx.to}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-300 hover:text-purple-400 transition-colors flex items-center gap-1"
                                >
                                    <span>{formatShortAddress(tx.to)}</span>
                                    <FiExternalLink size={10} className="opacity-60" />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(`to-${tx.to}`, tx.to!)}
                                    className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                    title="Copy To Address"
                                >
                                    {toCopied ? <FiCheck className="text-emerald-400 size-3" /> : <FiCopy className="size-3 opacity-60" />}
                                </button>
                            </>
                        ) : (
                            <span className="text-zinc-500 italic">Contract Creation</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-zinc-800/40 text-xs">
                {tx.method && (
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Method</span>
                        <span className="font-mono text-zinc-300 capitalize">{tx.method}</span>
                    </div>
                )}
                {tx.nonce !== null && tx.nonce !== undefined && (
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Nonce</span>
                        <span className="font-mono text-zinc-300">{tx.nonce}</span>
                    </div>
                )}
                {tx.gasUsed && (
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Gas Used</span>
                        <span className="font-mono text-zinc-300">{Number(tx.gasUsed).toLocaleString()}</span>
                    </div>
                )}
                {tx.gasPrice && (
                    <div>
                        <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Gas Price</span>
                        <span className="font-mono text-zinc-300">{Number(tx.gasPrice).toFixed(2)} Gwei</span>
                    </div>
                )}
            </div>

            {tx.tokenTransfers && tx.tokenTransfers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-800/60">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider block mb-2">
                        Token Transfers ({tx.tokenTransfers.length})
                    </span>
                    <div className="space-y-1.5">
                        {tx.tokenTransfers.map((transfer, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between text-xs p-2 bg-zinc-900/60 border border-zinc-800/40 rounded-lg"
                            >
                                <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
                                    <span>{formatShortAddress(transfer.from)}</span>
                                    <span>→</span>
                                    <span>{formatShortAddress(transfer.to)}</span>
                                </div>
                                <span className="font-bold text-zinc-200">
                                    {transfer.amount} <span className="text-purple-400">{transfer.tokenSymbol}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
