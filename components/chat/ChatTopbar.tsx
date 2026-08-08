'use client'

import { FiActivity, FiMinimize2, FiTrash2, FiLoader } from 'react-icons/fi'
import { formatTokens } from '@/lib/format'

interface ChatTopbarProps {
    title: string
    totalTokens: number | null
    txCount: number
    onOpenTransactions: () => void
    onRequestCompact?: () => void
    onRequestClear?: () => void
    isCompacting?: boolean
    isClearing?: boolean
}

export default function ChatTopbar({
    title,
    totalTokens,
    txCount,
    onOpenTransactions,
    onRequestCompact,
    onRequestClear,
    isCompacting = false,
    isClearing = false,
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

                {onRequestCompact && (
                    <button
                        type="button"
                        onClick={onRequestCompact}
                        disabled={isCompacting || isClearing}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400 hover:text-purple-400 hover:border-purple-900/60 hover:bg-purple-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Compact chat context (Eve session compaction)"
                        aria-label="Compact chat context"
                    >
                        {isCompacting ? (
                            <FiLoader className="animate-spin text-purple-400" size={14} />
                        ) : (
                            <FiMinimize2 size={14} />
                        )}
                        <span className="hidden sm:inline font-medium">Compact</span>
                    </button>
                )}

                {onRequestClear && (
                    <button
                        type="button"
                        onClick={onRequestClear}
                        disabled={isCompacting || isClearing}
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Clear chat context"
                        aria-label="Clear chat context"
                    >
                        {isClearing ? (
                            <FiLoader className="animate-spin text-red-400" size={14} />
                        ) : (
                            <FiTrash2 size={14} />
                        )}
                        <span className="hidden sm:inline font-medium">Clear</span>
                    </button>
                )}

                {txCount > 0 && (
                    <button
                        type="button"
                        onClick={onOpenTransactions}
                        className="relative flex items-center justify-center size-8 rounded-lg border border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:text-emerald-400 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                        title="On-chain transactions"
                        aria-label={`Open transactions panel (${txCount})`}
                    >
                        <FiActivity size={16} />
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center justify-center tabular-nums">
                            {txCount > 99 ? '99+' : txCount}
                        </span>
                    </button>
                )}
            </div>
        </header>
    )
}

