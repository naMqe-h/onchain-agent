'use client'

import { useEffect, useRef, useState } from 'react'
import { FiMoreHorizontal } from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'
import { formatTokens } from '@/lib/format'
import { scaleIn } from '../../lib/motion'

interface ChatMobileMetaFabProps {
    totalTokens: number | null
    txCount: number
    onOpenTransactions: () => void
}

export default function ChatMobileMetaFab({
    totalTokens,
    txCount,
    onOpenTransactions,
}: ChatMobileMetaFabProps) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = rootRef.current
            if (!el) return
            if (e.target instanceof Node && !el.contains(e.target)) {
                setOpen(false)
            }
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('touchstart', onPointerDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('touchstart', onPointerDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <div
            ref={rootRef}
            className="md:hidden absolute right-8 bottom-full mb-2 z-20 flex flex-col items-end"
        >
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="meta-menu"
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="mb-2 w-52 rounded-xl border border-zinc-800 bg-[#171719]/95 backdrop-blur-md shadow-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-800/80">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                Tokens
                            </span>
                            <span className="text-sm font-semibold text-zinc-100 tabular-nums">
                                {totalTokens === null
                                    ? '…'
                                    : formatTokens(totalTokens)}
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={txCount === 0}
                            onClick={() => {
                                if (txCount === 0) return
                                setOpen(false)
                                onOpenTransactions()
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors ${
                                txCount === 0
                                    ? 'cursor-not-allowed opacity-60'
                                    : 'hover:bg-zinc-800/70 cursor-pointer'
                            }`}
                        >
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                Transactions
                            </span>
                            <span className="text-sm font-semibold text-zinc-100 tabular-nums">
                                {txCount}
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center justify-center size-10 rounded-full border border-zinc-700/80 bg-[#171719]/95 backdrop-blur-md text-zinc-300 shadow-lg hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
                aria-label="Chat info"
                aria-expanded={open}
            >
                <FiMoreHorizontal size={18} />
            </button>
        </div>
    )
}
