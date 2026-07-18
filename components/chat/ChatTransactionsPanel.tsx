'use client'

import { FiX, FiExternalLink, FiActivity } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { slideInRight } from '../../lib/motion'
import {
    formatCompactAmount,
    formatRelativeTime,
} from '@/lib/format'
import { getNetworkIconSrc } from '@/lib/web3/config'
import type { ChatOnchainTx } from '@/lib/chat/extractOnchainTransactions'

interface ChatTransactionsPanelProps {
    transactions: ChatOnchainTx[]
    onClose: () => void
}

function TokenChip({
    amount,
    symbol,
    isNative,
    network,
}: {
    amount: string | null
    symbol: string | null
    isNative: boolean
    network: string
}) {
    if (!amount && !symbol) return <span className="text-zinc-500">—</span>

    const amt = amount ? formatCompactAmount(amount) : null
    const sym = symbol || ''

    return (
        <span className="inline-flex items-center gap-1 min-w-0 align-middle">
            {amt != null && (
                <span className="tabular-nums text-zinc-100 font-medium">{amt}</span>
            )}
            {sym && (
                <span className="inline-flex items-center gap-1 min-w-0 text-zinc-200 font-medium">
                    {isNative && (
                        <img
                            src={getNetworkIconSrc(network)}
                            alt=""
                            width={14}
                            height={14}
                            className="size-3.5 rounded-full object-cover shrink-0"
                        />
                    )}
                    <span className="truncate">{sym}</span>
                </span>
            )}
        </span>
    )
}

function TxSummaryLine({ tx }: { tx: ChatOnchainTx }) {
    if (tx.kind === 'swap') {
        return (
            <p className="text-xs text-zinc-300 leading-relaxed min-w-0 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                <span className="text-zinc-500">Swapped</span>
                <TokenChip
                    amount={tx.inAmount}
                    symbol={tx.inSymbol}
                    isNative={tx.inIsNative}
                    network={tx.network}
                />
                <span className="text-zinc-500">for</span>
                <TokenChip
                    amount={tx.outAmount}
                    symbol={tx.outSymbol}
                    isNative={tx.outIsNative}
                    network={tx.network}
                />
            </p>
        )
    }

    return (
        <p className="text-xs text-zinc-300 leading-relaxed min-w-0 flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span className="text-zinc-500">Sent</span>
            <TokenChip
                amount={tx.outAmount}
                symbol={tx.outSymbol}
                isNative={tx.outIsNative}
                network={tx.network}
            />
        </p>
    )
}

export default function ChatTransactionsPanel({
    transactions,
    onClose,
}: ChatTransactionsPanelProps) {
    return (
        <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-0 bottom-0 w-80 md:w-96 max-w-full border-l border-zinc-800 bg-[#171719]/95 backdrop-blur-md h-full flex flex-col text-zinc-300 z-30 shadow-2xl overflow-hidden min-w-0"
        >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0 min-w-0">
                <div className="flex items-center gap-2 font-semibold text-zinc-100 min-w-0">
                    <FiActivity size={18} className="text-emerald-400 shrink-0" />
                    <span className="truncate">Transactions</span>
                    {transactions.length > 0 && (
                        <span className="text-xs font-normal text-zinc-500 tabular-nums">
                            ({transactions.length})
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label="Close transactions panel"
                >
                    <FiX size={18} />
                </button>
            </div>

            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-3 space-y-2">
                {transactions.length === 0 ? (
                    <p className="text-sm text-zinc-500 px-1 py-6 text-center">
                        No on-chain transactions in this chat yet.
                    </p>
                ) : (
                    transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 space-y-1.5 min-w-0"
                        >
                            <TxSummaryLine tx={tx} />

                            <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="text-[11px] text-zinc-500 truncate">
                                    {tx.createdAt
                                        ? formatRelativeTime(tx.createdAt)
                                        : '—'}
                                </span>
                                <a
                                    href={tx.explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 hover:text-emerald-300 transition-colors shrink-0"
                                >
                                    Explorer
                                    <FiExternalLink size={11} className="opacity-70" />
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    )
}
