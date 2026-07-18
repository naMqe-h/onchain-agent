import { useState, useRef, useEffect, useCallback } from 'react'
import { TbBrain, TbTool } from 'react-icons/tb'
import { FiCopy, FiCheck } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import TokenInfoCard from './tools/get_token_info/TokenInfoCard'
import TokenInfoSkeleton from './tools/get_token_info/TokenInfoSkeleton'
import TokenBalancesTable from './tools/get_token_balances/TokenBalancesTable'
import TokenBalancesSkeleton from './tools/get_token_balances/TokenBalancesSkeleton'
import SendErc20Card from './tools/send_erc20/SendErc20Card'
import SendErc20Skeleton from './tools/send_erc20/SendErc20Skeleton'
import SendNativeCard from './tools/send_native/SendNativeCard'
import SendNativeSkeleton from './tools/send_native/SendNativeSkeleton'
import SwapCard from './tools/swap_tokens/SwapCard'
import SwapSkeleton from './tools/swap_tokens/SwapSkeleton'
import { messageHasReasoning, messageHasTools, type AnalysisPanelMode } from './AgentAnalysisPanel'
import { slideInUp, staggerContainer } from '../../lib/motion'

interface Message {
    id: string
    role: 'user' | 'assistant'
    parts?: readonly any[]
}

interface ChatMessagesListProps {
    chatId: string | null
    messages: readonly Message[]
    activeMessageId: string | null
    activePanelMode: AnalysisPanelMode | null
    onToggleAnalysis: (id: string, mode: AnalysisPanelMode) => void
    isBusy?: boolean
    showError?: boolean
}

interface MessageItemProps {
    message: Message
    isReasoningActive: boolean
    isToolsActive: boolean
    onToggleReasoning: () => void
    onToggleTools: () => void
    isLast: boolean
    isBusy?: boolean
}

function getMessagePlainText(message: Message): string {
    if (!message.parts || message.parts.length === 0) {
        return typeof (message as any).content === 'string' ? (message as any).content : ''
    }

    const textFromParts = message.parts
        .filter(part => part.type === 'text' && typeof part.text === 'string')
        .map(part => part.text.trim())
        .filter(Boolean)
        .join('\n\n')

    if (textFromParts) return textFromParts

    const errorText = message.parts.find(part => part.type === 'error' && typeof part.text === 'string')?.text
    if (errorText) return errorText

    return typeof (message as any).content === 'string' ? (message as any).content : ''
}

function CopyMessageButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!text.trim()) return
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-[#1e1e20] hover:text-zinc-200"
            title={copied ? 'Copied' : 'Copy message'}
            aria-label={copied ? 'Copied' : 'Copy message'}
        >
            {copied ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
        </button>
    )
}

function MessageItem({ message, isReasoningActive, isToolsActive, onToggleReasoning, onToggleTools, isLast, isBusy }: MessageItemProps) {
    const [time] = useState(() => {
        const d = (message as any).createdAt || (message as any).timestamp
        if (d) return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    const errorParts = message.parts?.filter(part => part.type === 'error') ?? []
    const isErrorMessage = errorParts.length > 0 || (message as any).content === 'Something went wrong'
    const plainText = getMessagePlainText(message)
    const canCopy = plainText.trim().length > 0

    const hasReasoning = !isErrorMessage && messageHasReasoning(message)
    const hasTools = !isErrorMessage && messageHasTools(message)

    const renderContent = () => {
        if (!message.parts || message.parts.length === 0) return null

        if (isErrorMessage) {
            const text = errorParts[0]?.text || (message as any).content || 'Something went wrong'
            return (
                <p className="text-sm text-rose-400/90">
                    {text}
                </p>
            )
        }

        const textParts = message.parts.filter(part => part.type === 'text')
        const tokenInfoParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'get_token_info')
        const tokenBalancesParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'get_token_balances')
        const sendErc20Parts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'send_erc20')
        const sendNativeParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'send_native')
        const swapParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'swap_tokens')

        return (
            <div className="flex flex-col gap-2 w-full">
                {textParts.map((part, i) => (
                    <div key={`text-${i}`} className="wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3 [&_p:empty]:hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_li>p]:mb-0 [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic [&_code]:bg-[#1a1a1c] [&_code]:text-pink-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-200 [&_pre_code]:p-0 [&_pre]:bg-[#1a1a1c] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_a]:text-blue-400 [&_a]:underline">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                    </div>
                ))}
                {tokenInfoParts.map((part, i) => {
                    if (part.state === 'executing' || part.state === 'requested') {
                        return <TokenInfoSkeleton key={`token-skeleton-${i}`} />
                    }
                    if (part.state === 'output-available') {
                        const tokenData = part.output?.token
                        if (tokenData) {
                            return <TokenInfoCard key={`token-card-${i}`} token={tokenData} />
                        }
                    }
                    return null
                })}
                {tokenBalancesParts.map((part, i) => {
                    if (part.state === 'executing' || part.state === 'requested') {
                        return <TokenBalancesSkeleton key={`token-balances-skeleton-${i}`} />
                    }
                    if (
                        part.state === 'output-available' &&
                        part.output?.success === true &&
                        Array.isArray(part.output.tokens) &&
                        part.output.tokens.length > 0
                    ) {
                        return <TokenBalancesTable key={`token-balances-table-${i}`} data={part.output} />
                    }
                    return null
                })}
                {sendErc20Parts.map((part, i) => {
                    if (part.state === 'executing' || part.state === 'requested') {
                        return <SendErc20Skeleton key={`send-erc20-skeleton-${i}`} />
                    }
                    if (part.state === 'output-available' && part.output?.success === true) {
                        return <SendErc20Card key={`send-erc20-card-${i}`} tx={part.output} />
                    }
                    return null
                })}
                {sendNativeParts.map((part, i) => {
                    if (part.state === 'executing' || part.state === 'requested') {
                        return <SendNativeSkeleton key={`send-native-skeleton-${i}`} />
                    }
                    if (part.state === 'output-available' && part.output?.success === true) {
                        return <SendNativeCard key={`send-native-card-${i}`} tx={part.output} />
                    }
                    return null
                })}
                {swapParts.map((part, i) => {
                    if (part.state === 'executing' || part.state === 'requested') {
                        return <SwapSkeleton key={`swap-skeleton-${i}`} />
                    }
                    if (part.state === 'output-available' && part.output?.success === true) {
                        return <SwapCard key={`swap-card-${i}`} tx={part.output} />
                    }
                    return null
                })}
            </div>
        )
    }

    if (message.role === 'user') {
        return (
            <motion.div
                variants={slideInUp}
                className="flex flex-col items-end justify-end w-full gap-1"
            >
                <div className="bg-[#1e1e20] text-zinc-200 px-5 py-3 rounded-[24px] max-w-[85%] text-[15px] leading-relaxed">
                    {renderContent()}
                </div>
                <div className="flex items-center gap-1 px-1 text-zinc-500">
                    <span className="text-[11px] px-1">{time}</span>
                    {canCopy && <CopyMessageButton text={plainText} />}
                </div>
            </motion.div>
        )
    }

    const isWriting = message.role === 'assistant' && isLast && isBusy && !isErrorMessage

    return (
        <motion.div
            variants={slideInUp}
            className="flex flex-col items-start w-full gap-2"
        >
            <div className={`text-[15px] leading-relaxed w-full ${isErrorMessage ? '' : 'text-zinc-200'}`}>
                {renderContent()}
            </div>

            {!isWriting && (
                <div className="flex items-center gap-2 mt-1 text-zinc-500">
                    <span className="text-[11px] font-medium">{time}</span>
                    {canCopy && <CopyMessageButton text={plainText} />}
                    {!isErrorMessage && (hasReasoning || hasTools) && (
                        <div className="flex items-center gap-1.5">
                            {hasReasoning && (
                                <button
                                    onClick={onToggleReasoning}
                                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${isReasoningActive ? 'bg-zinc-800 text-white' : 'hover:bg-[#1e1e20] hover:text-zinc-200'}`}
                                    title="Toggle reasoning panel"
                                    aria-label="Toggle reasoning panel"
                                >
                                    <TbBrain size={16} />
                                </button>
                            )}
                            {hasTools && (
                                <button
                                    onClick={onToggleTools}
                                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${isToolsActive ? 'bg-zinc-800 text-white' : 'hover:bg-[#1e1e20] hover:text-zinc-200'}`}
                                    title="Toggle tools panel"
                                    aria-label="Toggle tools panel"
                                >
                                    <TbTool size={16} />
                                </button>
                            )}
                            {(message as any).aggregateMetrics && (
                                <span className="text-[11px] text-zinc-500 font-mono ml-0.5">
                                    (took {((message as any).aggregateMetrics.durationMs < 1000) ? `${(message as any).aggregateMetrics.durationMs}ms` : `${((message as any).aggregateMetrics.durationMs / 1000).toFixed(1)}s`}{(message as any).aggregateMetrics.totalTokens > 0 ? `, used ${(message as any).aggregateMetrics.totalTokens} tkn` : ''})
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
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

