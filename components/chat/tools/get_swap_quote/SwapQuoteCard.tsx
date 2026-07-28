'use client'

import { useState } from 'react'
import { FiArrowRight, FiCopy, FiCheck, FiExternalLink, FiRefreshCw } from 'react-icons/fi'
import {
    getExplorerBaseUrl,
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '../../../../lib/web3/config'
import { formatCompactAmount, formatGasFee, formatShortAddress, formatUsd } from '../../../../lib/format'
import { SwapQuoteData } from '../../../../types'

interface SwapQuoteCardProps {
    data: SwapQuoteData
}

export default function SwapQuoteCard({ data }: SwapQuoteCardProps) {
    const [copied, setCopied] = useState(false)

    const network = normalizeNetworkId(data.network)
    const baseExplorer = getExplorerBaseUrl(network)
    const networkLabel = data.networkLabel || getNetworkShortLabel(network)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.from)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy address:', err)
        }
    }

    const formatEstGasFee = () => {
        if (data.gasFeeUSD) {
            const num = Number(data.gasFeeUSD)
            if (Number.isFinite(num)) {
                return formatUsd(num)
            }
            return `$${formatGasFee(data.gasFeeUSD)}`
        }
        if (data.gasUseEstimate) {
            return `${formatCompactAmount(data.gasUseEstimate)} units`
        }
        return '—'
    }

    return (
        <div className="w-full max-w-md bg-[#171719]/90 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-500/40 my-2">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <FiRefreshCw size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Swap Quote</h3>
                        <span className="text-[10px] font-medium text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            Simulation Only
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-full">
                    <img
                        src={getNetworkIconSrc(network)}
                        alt={networkLabel}
                        className="w-3.5 h-3.5 rounded-full object-contain shrink-0"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {networkLabel}
                    </span>
                </div>
            </div>

            <div className="my-4 p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold">You Pay</span>
                    <span className="text-lg font-bold text-white truncate" title={data.amountIn}>
                        {formatCompactAmount(data.amountIn)}{' '}
                        <span className="text-sm font-semibold text-zinc-400">{data.tokenIn.symbol}</span>
                    </span>
                </div>

                <div className="p-2 rounded-full bg-zinc-800 text-amber-400 shrink-0">
                    <FiArrowRight size={16} />
                </div>

                <div className="flex flex-col items-end min-w-0 text-right">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold">Estimated Receive</span>
                    <span className="text-lg font-bold text-emerald-400 truncate" title={data.amountOut || undefined}>
                        {data.amountOut ? formatCompactAmount(data.amountOut) : '—'}{' '}
                        <span className="text-sm font-semibold text-zinc-400">{data.tokenOut.symbol}</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex flex-col gap-0.5">
                    <span className="text-[11px] text-zinc-500">Slippage Tolerance</span>
                    <span className="font-medium text-zinc-300">
                        {data.slippageTolerance !== undefined ? `${data.slippageTolerance}%` : 'Default (0.5%)'}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex flex-col gap-0.5">
                    <span className="text-[11px] text-zinc-500">Est. Gas Fee</span>
                    <span className="font-medium text-zinc-300">
                        {formatEstGasFee()}
                    </span>
                </div>

                {data.routing && (
                    <div className="col-span-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex justify-between items-center">
                        <span className="text-[11px] text-zinc-500">Routing Protocol</span>
                        <span className="font-mono text-zinc-300 font-medium">{data.routing}</span>
                    </div>
                )}
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Wallet Address"
                >
                    <span>{formatShortAddress(data.from)}</span>
                    {copied ? (
                        <FiCheck size={12} className="text-emerald-400 shrink-0" />
                    ) : (
                        <FiCopy size={12} className="opacity-60 shrink-0" />
                    )}
                </button>

                {baseExplorer && (
                    <a
                        href={`${baseExplorer}/address/${data.from}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                        <span>Explorer</span>
                        <FiExternalLink size={12} />
                    </a>
                )}
            </div>
        </div>
    )
}

