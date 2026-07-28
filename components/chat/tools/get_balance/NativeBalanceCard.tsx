'use client'

import { useState } from 'react'
import { FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi'
import {
    getExplorerBaseUrl,
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '../../../../lib/web3/config'
import { formatBalance, formatShortAddress } from '../../../../lib/format'
import { NativeBalanceData } from '../../../../types'
import { FaWallet } from 'react-icons/fa6'

interface NativeBalanceCardProps {
    data: NativeBalanceData
}

export default function NativeBalanceCard({ data }: NativeBalanceCardProps) {
    const [copied, setCopied] = useState(false)

    const network = normalizeNetworkId(data.network)
    const baseExplorer = getExplorerBaseUrl(network)
    const networkLabel = getNetworkShortLabel(network)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
        }
    }

    return (
        <div className="w-full max-w-md bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-2">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <FaWallet size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Native Balance</h3>
                        <p className="text-[11px] text-zinc-500 font-mono">
                            {formatShortAddress(data.address)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-full">
                    <img
                        src={getNetworkIconSrc(network)}
                        alt={networkLabel}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {networkLabel || data.network}
                    </span>
                </div>
            </div>

            <div className="py-6 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight" title={data.balance}>
                    {formatBalance(data.balance)}{' '}
                    <span className="text-xl font-semibold text-purple-400">{data.symbol}</span>
                </span>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy Address"
                    >
                        <span>{formatShortAddress(data.address)}</span>
                        {copied ? (
                            <FiCheck size={12} className="text-emerald-400 shrink-0" />
                        ) : (
                            <FiCopy size={12} className="opacity-60 shrink-0" />
                        )}
                    </button>
                </div>

                {baseExplorer && (
                    <a
                        href={`${baseExplorer}/address/${data.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                        <span>Explorer</span>
                        <FiExternalLink size={12} />
                    </a>
                )}
            </div>
        </div>
    )
}

