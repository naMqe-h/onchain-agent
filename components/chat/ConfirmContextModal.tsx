'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FiMinimize2, FiTrash2, FiLoader } from 'react-icons/fi'

export type ContextModalMode = 'compact' | 'clear'

interface ConfirmContextModalProps {
    isOpen: boolean
    mode: ContextModalMode | null
    isPending?: boolean
    onClose: () => void
    onConfirm: () => void
}

export default function ConfirmContextModal({
    isOpen,
    mode,
    isPending = false,
    onClose,
    onConfirm,
}: ConfirmContextModalProps) {
    if (!isOpen || !mode) return null

    const isCompact = mode === 'compact'
    const title = isCompact ? 'Compact Chat Context' : 'Clear Chat Context'
    const description = isCompact
        ? 'Compacting the chat context will compress the conversation history and optimize LLM token usage while retaining key conversation memory.'
        : 'Clearing the chat context will erase the current conversation history and reset the session.'
    const confirmLabel = isCompact ? 'Compact Context' : 'Clear Context'

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="bg-[#19191c] border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2.5 rounded-xl border ${
                                isCompact
                                    ? 'bg-purple-950/40 border-purple-800/50 text-purple-400'
                                    : 'bg-red-950/40 border-red-800/50 text-red-400'
                            }`}
                        >
                            {isCompact ? <FiMinimize2 size={20} /> : <FiTrash2 size={20} />}
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
                            <p className="text-xs text-zinc-400">Are you sure you want to proceed?</p>
                        </div>
                    </div>

                    <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-xl">
                        {description}
                    </p>

                    <div className="flex items-center justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                isCompact
                                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30'
                                    : 'bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/30'
                            }`}
                        >
                            {isPending && <FiLoader className="animate-spin" size={14} />}
                            <span>{confirmLabel}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
