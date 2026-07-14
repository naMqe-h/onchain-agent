import { useState, useRef, useEffect, useCallback } from 'react'
import { TbBrain } from 'react-icons/tb'
import ReactMarkdown from 'react-markdown'

interface Message {
    id: string
    role: 'user' | 'assistant'
    parts?: readonly any[]
}

interface ChatMessagesListProps {
    chatId: string | null
    messages: readonly Message[]
    activeMessageId: string | null
    onToggleReasoning: (id: string) => void
    isBusy?: boolean
}

interface MessageItemProps {
    message: Message
    isActive: boolean
    onToggleReasoning: () => void
}

function MessageItem({ message, isActive, onToggleReasoning }: MessageItemProps) {
    const [time] = useState(() => {
        const d = (message as any).createdAt || (message as any).timestamp
        if (d) return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    const hasReasoning = message.parts?.some(part => part.type === 'reasoning') || message.parts?.some(part => part.type === 'dynamic-tool')

    const renderContent = () => {
        if (!message.parts || message.parts.length === 0) return null
        return message.parts.map((part, i) => {
            if (part.type === 'text') {
                return (
                    <div key={i} className="wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3 [&_p:empty]:hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_li>p]:mb-0 [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic [&_code]:bg-[#1a1a1c] [&_code]:text-pink-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-200 [&_pre_code]:p-0 [&_pre]:bg-[#1a1a1c] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_a]:text-blue-400 [&_a]:underline">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                    </div>
                )
            }
            return null
        })
    }

    if (message.role === 'user') {
        return (
            <div className="flex flex-col items-end justify-end w-full gap-1">
                <div className="bg-[#1e1e20] text-zinc-200 px-5 py-3 rounded-[24px] max-w-[85%] text-[15px] leading-relaxed">
                    {renderContent()}
                </div>
                <span className="text-[11px] text-zinc-500 px-2">{time}</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-start w-full gap-2">
            <div className="text-zinc-200 text-[15px] leading-relaxed w-full">
                {renderContent()}
            </div>

            <div className="flex items-center gap-3 mt-1 text-zinc-500">
                <span className="text-[11px] font-medium">{time}</span>
                {hasReasoning && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleReasoning}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-2 ${isActive ? 'bg-zinc-800 text-white' : 'hover:bg-[#1e1e20] hover:text-zinc-200'}`}
                            title="Toggle reasoning panel"
                        >
                            <TbBrain size={16} />
                        </button>
                        {(message as any).aggregateMetrics && (
                            <span className="text-[11px] text-zinc-500 font-mono">
                                (took {((message as any).aggregateMetrics.durationMs < 1000) ? `${(message as any).aggregateMetrics.durationMs}ms` : `${((message as any).aggregateMetrics.durationMs / 1000).toFixed(1)}s`}{(message as any).aggregateMetrics.totalTokens > 0 ? `, used ${(message as any).aggregateMetrics.totalTokens} tkn` : ''})
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const hasTextContent = (message: Message) => {
    if (!message.parts || message.parts.length === 0) return false
    return message.parts.some(part => part.type === 'text' && part.text && part.text.trim().length > 0)
}

export default function ChatMessagesList({ chatId, messages, activeMessageId, onToggleReasoning, isBusy }: ChatMessagesListProps) {
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
    }, [messages])

    useEffect(() => {
        if (isBusy && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
    }, [isBusy])

    if (!messages || messages.length === 0) {
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
            <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-4 pt-8">
                {messages.map((message, idx) => (
                    <MessageItem
                        key={idx}
                        message={message}
                        isActive={activeMessageId === message.id}
                        onToggleReasoning={() => onToggleReasoning(message.id)}
                    />
                ))}
                {isBusy && (
                    messages[messages.length - 1]?.role === 'user' ||
                    (messages[messages.length - 1]?.role === 'assistant' && !hasTextContent(messages[messages.length - 1]))
                ) && (
                    <div className="flex flex-col items-start w-full gap-2">
                        <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1e1e20]/40 rounded-[20px] border border-white/5 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

