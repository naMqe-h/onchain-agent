import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { slideInUp, staggerContainer } from '../../lib/motion'
import MessageItem from './messages/MessageItem'

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    parts?: readonly any[]
}

interface ChatMessagesListProps {
    chatId: string | null
    messages: readonly Message[]
    activeMessageId: string | null
    activePanelMode: 'reasoning' | 'tools' | null
    onToggleAnalysis: (id: string, mode: 'reasoning' | 'tools') => void
    isBusy?: boolean
    showError?: boolean
}

const hasTextContent = (message: Message) => {
    if (!message.parts || message.parts.length === 0) return false
    return message.parts.some(part => part.type === 'text' && part.text && part.text.trim().length > 0)
}

export default function ChatMessagesList({ chatId, messages, activeMessageId, activePanelMode, onToggleAnalysis, isBusy, showError }: ChatMessagesListProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isAtBottomRef = useRef(true)

    const handleScroll = useCallback(() => {
        const container = containerRef.current
        if (!container) return

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
        isAtBottomRef.current = isNearBottom
    }, [])

    useEffect(() => {
        isAtBottomRef.current = true

        const raf = requestAnimationFrame(() => {
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight
            }
        })

        return () => cancelAnimationFrame(raf)
    }, [chatId])

    useEffect(() => {
        if (isAtBottomRef.current && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [messages, showError])

    useEffect(() => {
        if (isBusy && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [isBusy])

    if ((!messages || messages.length === 0) && !showError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <span className="text-xl">What can I help with?</span>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:px-8 space-y-8"
        >
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-3xl mx-auto flex flex-col gap-8 pb-4 pt-8"
            >
                {messages.map((message, idx) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        isReasoningActive={activeMessageId === message.id && activePanelMode === 'reasoning'}
                        isToolsActive={activeMessageId === message.id && activePanelMode === 'tools'}
                        onToggleReasoning={() => onToggleAnalysis(message.id, 'reasoning')}
                        onToggleTools={() => onToggleAnalysis(message.id, 'tools')}
                        isLast={idx === messages.length - 1}
                        isBusy={isBusy}
                    />
                ))}
                {isBusy && (
                    messages[messages.length - 1]?.role === 'user' ||
                    (messages[messages.length - 1]?.role === 'assistant' && !hasTextContent(messages[messages.length - 1]))
                ) && (
                        <motion.div variants={slideInUp} className="flex flex-col items-start w-full gap-2">
                            <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1e1e20]/40 rounded-[20px] border border-white/5 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                {showError && !isBusy && !messages.some(m =>
                    m.parts?.some((p: any) => p.type === 'error') ||
                    (m as any).content === 'Something went wrong'
                ) && (
                        <motion.div variants={slideInUp} className="flex flex-col items-start w-full">
                            <p className="text-sm text-rose-400/90 px-1">
                                Something went wrong
                            </p>
                        </motion.div>
                    )}
            </motion.div>
        </div>
    )
}
