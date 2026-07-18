'use client'

import { FiActivity } from 'react-icons/fi'
import { formatTokens } from '@/lib/format'

interface ChatTopbarProps {
    title: string
    totalTokens: number | null
    txCount: number
    onOpenTransactions: () => void
}

export default function ChatTopbar({
    title,
    totalTokens,
    txCount,
    onOpenTransactions,
}: ChatTopbarProps) {
    return (
        <header className="hidden md:flex items-center justify-between gap-3 h-12 px-4 border-b border-zinc-800/80 bg-[#131314]/90 backdrop-blur-sm shrink-0 min-w-0">
            <h1
                className="text-sm font-medium text-zinc-100 truncate min-w-0"
                title={title}
            >
                {title}
            </h1>

            <div className="flex items-center gap-2 shrink-0">
                <div
                    className="flex items-center gap-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400 tabular-nums"
                    title="Total LLM tokens used in this chat"
                >
                    <span className="text-zinc-500 uppercase tracking-wide text-[10px] font-semibold">
                        Tokens
                    </span>
                    <span className="text-zinc-200 font-medium">
                        {totalTokens === null ? '…' : formatTokens(totalTokens)}
                    </span>
                </div>

                {txCount > 0 && (
                    <button
                        type="button"
                        onClick={onOpenTransactions}
                        className="relative flex items-center justify-center size-8 rounded-lg border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:text-emerald-400 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                        title="On-chain transactions"
                        aria-label={`Open transactions panel (${txCount})`}
                    >
                        <FiActivity size={16} />
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center justify-center tabular-nums">
                            {txCount > 99 ? '99+' : txCount}
                        </span>
                    </button>
                )}
            </div>
        </header>
    )
}
