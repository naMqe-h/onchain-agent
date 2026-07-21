'use client'

import { useState } from 'react'
import { FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi'
import { formatCompactAmount } from '@/lib/format'
import {
    getExplorerBaseUrl,
    getNativeCurrencySymbol,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '@/lib/web3/config'
import { SwapTx } from '@/types'

interface SwapCardProps {
    tx: SwapTx
}

function shortAddress(addr: string): string {
    if (!addr || addr.length < 12) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function CopyableRow({
    label,
    value,
    href,
    display,
    copiedKey,
    activeKey,
    onCopy,
}: {
    label: string
    value: string | undefined
    href?: string
    display?: string
    copiedKey: string
    activeKey: string | null
    onCopy: (key: string, text: string) => void
}) {
    const isCopied = activeKey === copiedKey
    const text = display ?? shortAddress(value ?? '')

    return (
        <div className="flex items-center justify-between gap-3 bg-zinc-900/60 px-3.5 py-2.5 rounded-xl border border-zinc-800/80 min-w-0">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    {label}
                </span>
                {href ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-zinc-300 hover:text-purple-400 flex items-center gap-1 transition-colors min-w-0"
                    >
                        <span className="truncate">{text}</span>
                        <FiExternalLink size={12} className="opacity-60 shrink-0" />
                    </a>
                ) : (
                    <span className="text-xs font-mono text-zinc-300 truncate">{text}</span>
                )}
            </div>
            <button
                type="button"
                onClick={() => onCopy(copiedKey, value ?? '')}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-700/50 shrink-0"
                title={`Copy ${label.toLowerCase()}`}
            >
                {isCopied ? (
                    <FiCheck className="text-emerald-400" size={16} />
                ) : (
                    <FiCopy size={16} />
                )}
            </button>
        </div>
    )
}

export default function SwapCard({ tx }: SwapCardProps) {
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const network = normalizeNetworkId(tx.network)
    const base = getExplorerBaseUrl(network)
    const networkLabel = getNetworkShortLabel(network)
    const gasSymbol = tx.nativeSymbol || getNativeCurrencySymbol(network)
    const gasFee = tx.gasFeeNative ?? tx.gasFeeEth
    const isPending = tx.status === 'pending' || tx.status === 'submitted'
    const inSym = tx.tokenIn?.symbol || 'IN'
    const outSym = tx.tokenOut?.symbol || 'OUT'

    const handleCopy = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedKey(key)
            setTimeout(() => setCopiedKey(null), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const tokenHref = (address: string, isNative?: boolean) => {
        if (isNative || !address || address.startsWith('0x0000000000000000000000000000000000000000')) {
            return undefined
        }
        return `${base}/token/${address}`
    }

    return (
        <div className="w-full max-w-2xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5">
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        Status
                    </span>
                    <span
                        className={`text-base font-bold capitalize ${tx.status === 'success'
                                ? 'text-emerald-400'
                                : isPending
                                    ? 'text-amber-400'
                                    : 'text-red-400'
                            }`}
                    >
                        {tx.status === 'success'
                            ? 'Success'
                            : isPending
                                ? 'Pending'
                                : tx.status || 'Failed'}
                    </span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        You pay
                    </span>
                    <span className="text-base font-bold text-zinc-100 break-all" title={tx.amountIn}>
                        {formatCompactAmount(tx.amountIn ?? '')}{' '}
                        <span className="text-sm font-semibold text-zinc-400">{inSym}</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        You receive
                    </span>
                    <span
                        className="text-base font-bold text-zinc-100 break-all"
                        title={tx.amountOut || undefined}
                    >
                        {tx.amountOut ? formatCompactAmount(tx.amountOut) : '—'}{' '}
                        <span className="text-sm font-semibold text-zinc-400">{outSym}</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        Gas Fee
                    </span>
                    <span className="text-base font-bold text-zinc-100 break-all">
                        {gasFee != null && gasFee !== '' ? (
                            <>
                                {gasFee}{' '}
                                <span className="text-sm font-semibold text-zinc-400">{gasSymbol}</span>
                            </>
                        ) : (
                            <span className="text-sm font-semibold text-zinc-500">—</span>
                        )}
                    </span>
                </div>
            </div>

            {isPending && tx.pendingReason ? (
                <p className="text-xs text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 mb-1">
                    {tx.pendingReason}
                </p>
            ) : null}

            <div className="flex flex-col gap-2.5 pt-4 border-t border-zinc-800/60">
                <CopyableRow
                    label="From"
                    value={tx.from}
                    href={`${base}/address/${tx.from}`}
                    copiedKey="from"
                    activeKey={copiedKey}
                    onCopy={handleCopy}
                />
                <CopyableRow
                    label="Token In"
                    value={tx.tokenIn?.address}
                    href={tokenHref(tx.tokenIn?.address ?? '', tx.tokenIn?.isNative)}
                    display={`${inSym} · ${shortAddress(tx.tokenIn?.address ?? '')}`}
                    copiedKey="tokenIn"
                    activeKey={copiedKey}
                    onCopy={handleCopy}
                />
                <CopyableRow
                    label="Token Out"
                    value={tx.tokenOut?.address}
                    href={tokenHref(tx.tokenOut?.address ?? '', tx.tokenOut?.isNative)}
                    display={`${outSym} · ${shortAddress(tx.tokenOut?.address ?? '')}`}
                    copiedKey="tokenOut"
                    activeKey={copiedKey}
                    onCopy={handleCopy}
                />
                {tx.approvalHash ? (
                    <CopyableRow
                        label="Approval Hash"
                        value={tx.approvalHash}
                        href={`${base}/tx/${tx.approvalHash}`}
                        copiedKey="approval"
                        activeKey={copiedKey}
                        onCopy={handleCopy}
                    />
                ) : null}
                <CopyableRow
                    label="Transaction Hash"
                    value={tx.hash}
                    href={`${base}/tx/${tx.hash}`}
                    copiedKey="hash"
                    activeKey={copiedKey}
                    onCopy={handleCopy}
                />
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 mt-1 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                        {networkLabel}
                    </span>
                    {tx.routing ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                            {tx.routing}
                        </span>
                    ) : null}
                    {typeof tx.slippageTolerance === 'number' ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                            {tx.slippageTolerance}% slip
                        </span>
                    ) : null}
                </div>
                <a
                    href={`${base}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-colors shrink-0"
                >
                    <span>View on Explorer</span>
                    <FiExternalLink size={14} />
                </a>
            </div>
        </div>
    )
}
