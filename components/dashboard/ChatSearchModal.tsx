'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { FiMessageSquare, FiSearch, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { searchChats, type ChatSearchResult } from '../../app/actions/chat/chat'
import { fadeInOut, scaleIn } from '../../lib/motion'

interface ChatSearchModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectChat?: () => void
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatch(text: string, query: string): ReactNode {
    const q = query.trim()
    if (!q || !text) return text

    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'))
    if (parts.length === 1) return text

    return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
            <mark
                key={i}
                className="bg-amber-400/20 text-amber-100/90 rounded-[2px] px-0.5 not-italic font-inherit"
            >
                {part}
            </mark>
        ) : (
            part
        )
    )
}

export default function ChatSearchModal({ isOpen, onClose, onSelectChat }: ChatSearchModalProps) {
    const router = useRouter()
    const backdropRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ChatSearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) return
        setQuery('')
        setResults([])
        setError(null)
        setIsLoading(false)
        const t = window.setTimeout(() => inputRef.current?.focus(), 50)
        return () => window.clearTimeout(t)
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return

        const trimmed = query.trim()
        if (trimmed.length < 2) {
            setResults([])
            setIsLoading(false)
            setError(null)
            return
        }

        let cancelled = false
        setIsLoading(true)
        setError(null)

        const timer = window.setTimeout(async () => {
            try {
                const data = await searchChats(trimmed)
                if (!cancelled) {
                    setResults(data)
                    setIsLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setResults([])
                    setError('Search failed. Try again.')
                    setIsLoading(false)
                }
            }
        }, 300)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [query, isOpen])

    const handleSelect = (chatId: string) => {
        onClose()
        onSelectChat?.()
        router.push(`/chat/${chatId}`)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    variants={fadeInOut}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-60 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-[12vh] sm:pt-[15vh]"
                    onClick={(e) => {
                        if (e.target === backdropRef.current) onClose()
                    }}
                >
                    <motion.div
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-md rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[min(70vh,520px)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/5">
                            <FiSearch size={16} className="shrink-0 text-zinc-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search chats…"
                                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-600 focus:ring-0 p-0"
                                aria-label="Search chats"
                            />
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                                aria-label="Close search"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2">
                            {error && (
                                <p className="px-3 py-4 text-sm text-red-400 text-center">{error}</p>
                            )}

                            {!error && isLoading && query.trim().length >= 2 && (
                                <p className="px-3 py-4 text-sm text-zinc-500 text-center">Searching…</p>
                            )}

                            {!error && !isLoading && query.trim().length >= 2 && results.length === 0 && (
                                <p className="px-3 py-4 text-sm text-zinc-500 text-center">No results</p>
                            )}

                            {!error && query.trim().length < 2 && (
                                <p className="px-3 py-4 text-sm text-zinc-600 text-center">
                                    Type at least 2 characters
                                </p>
                            )}

                            {!error && !isLoading && results.length > 0 && (
                                <ul className="flex flex-col gap-0.5">
                                    {results.map((item) => (
                                        <li key={item.chatId}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(item.chatId)}
                                                className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 transition-colors cursor-pointer"
                                            >
                                                <FiMessageSquare
                                                    size={14}
                                                    className="shrink-0 mt-0.5 opacity-60"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate leading-tight font-medium">
                                                        {highlightMatch(item.title, query)}
                                                    </p>
                                                    {item.matchType === 'message' && item.snippet && (
                                                        <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-snug">
                                                            {highlightMatch(item.snippet, query)}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
