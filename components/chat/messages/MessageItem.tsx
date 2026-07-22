'use client'

import { useState } from 'react'
import { TbBrain, TbTool } from 'react-icons/tb'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import TokenInfoCard from '../tools/get_token_info/TokenInfoCard'
import TokenInfoSkeleton from '../tools/get_token_info/TokenInfoSkeleton'
import TokenBalancesTable from '../tools/get_token_balances/TokenBalancesTable'
import TokenBalancesSkeleton from '../tools/get_token_balances/TokenBalancesSkeleton'
import SendErc20Card from '../tools/send_erc20/SendErc20Card'
import SendErc20Skeleton from '../tools/send_erc20/SendErc20Skeleton'
import SendNativeCard from '../tools/send_native/SendNativeCard'
import SendNativeSkeleton from '../tools/send_native/SendNativeSkeleton'
import SwapCard from '../tools/swap_tokens/SwapCard'
import SwapSkeleton from '../tools/swap_tokens/SwapSkeleton'
import TxHistoryCard from '../tools/get_tx_history/TxHistoryCard'
import TxHistorySkeleton from '../tools/get_tx_history/TxHistorySkeleton'
import TrendingTokensCard from '../tools/get_trending_tokens/TrendingTokensCard'
import TrendingTokensSkeleton from '../tools/get_trending_tokens/TrendingTokensSkeleton'
import CryptoPriceCard from '../tools/get_crypto_price/CryptoPriceCard'
import CryptoPriceSkeleton from '../tools/get_crypto_price/CryptoPriceSkeleton'
import { messageHasReasoning, messageHasTools } from '../AgentAnalysisPanel'
import { slideInUp } from '../../../lib/motion'
import CopyMessageButton from './CopyMessageButton'
import { type Message } from '@/types'

interface MessageItemProps {
    message: Message
    isReasoningActive: boolean
    isToolsActive: boolean
    onToggleReasoning: () => void
    onToggleTools: () => void
    isLast: boolean
    isBusy?: boolean
    activeNetwork?: string
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

    const usageLimit = message.parts.find(
        (part: any) => part.type === 'usage-limit' && typeof part.text === 'string'
    ) as { text?: string; resetsIn?: string } | undefined
    if (usageLimit?.text) {
        return usageLimit.resetsIn
            ? `${usageLimit.text}\n${usageLimit.resetsIn}`
            : usageLimit.text
    }

    const errorText = message.parts.find(part => part.type === 'error' && typeof part.text === 'string')?.text
    if (errorText) return errorText

    return typeof (message as any).content === 'string' ? (message as any).content : ''
}

export default function MessageItem({
    message,
    isReasoningActive,
    isToolsActive,
    onToggleReasoning,
    onToggleTools,
    isLast,
    isBusy,
    activeNetwork,
}: MessageItemProps) {
    const [time] = useState(() => {
        const d = (message as any).createdAt || (message as any).timestamp
        if (d) return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    const usageLimitPart = message.parts?.find((part: any) => part.type === 'usage-limit')
    const isUsageLimitMessage = Boolean(usageLimitPart) || message.role === 'system'

    const errorParts = message.parts?.filter(part => part.type === 'error') ?? []
    const isErrorMessage =
        !isUsageLimitMessage &&
        (errorParts.length > 0 || (message as any).content === 'Something went wrong')
    const plainText = getMessagePlainText(message)
    const canCopy = !isUsageLimitMessage && plainText.trim().length > 0

    const hasReasoning = !isErrorMessage && !isUsageLimitMessage && messageHasReasoning(message)
    const hasTools = !isErrorMessage && !isUsageLimitMessage && messageHasTools(message)

    if (isUsageLimitMessage) {
        const title =
            (typeof usageLimitPart?.title === 'string' && usageLimitPart.title) ||
            'Limit reached'
        const text =
            (typeof usageLimitPart?.text === 'string' && usageLimitPart.text) ||
            plainText ||
            "You've reached today's AI usage limit."
        const resetsIn =
            typeof usageLimitPart?.resetsIn === 'string' && usageLimitPart.resetsIn
                ? usageLimitPart.resetsIn
                : null

        return (
            <motion.div
                variants={slideInUp}
                className="flex w-full flex-col items-center justify-center px-4 py-3 text-center"
            >
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-500">{text}</p>
                {resetsIn ? (
                    <p className="mt-2 text-xs text-zinc-600">
                        {resetsIn}
                    </p>
                ) : null}
            </motion.div>
        )
    }

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
        const txHistoryParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'get_tx_history')
        const trendingTokensParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'get_trending_tokens')
        const cryptoPriceParts = message.parts.filter(part => part.type === 'dynamic-tool' && part.toolName === 'get_crypto_price')

        const showCustomComponents = !(isLast && isBusy)

        return (
            <div className="flex flex-col gap-2 w-full">
                {textParts.map((part, i) => (
                    <div key={`text-${i}`} className="wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-3 [&_p:empty]:hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_li>p]:mb-0 [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic [&_code]:bg-[#1a1a1c] [&_code]:text-pink-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-200 [&_pre_code]:p-0 [&_pre]:bg-[#1a1a1c] [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_a]:text-blue-400 [&_a]:underline">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                    </div>
                ))}
                {showCustomComponents && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex flex-col gap-2 w-full"
                    >
                        {cryptoPriceParts.map((part, i) => {
                            if (part.state === 'executing' || part.state === 'requested') {
                                return <CryptoPriceSkeleton key={`crypto-price-skeleton-${i}`} />
                            }
                            if (part.state === 'output-available') {
                                if (part.output?.success && part.output?.found && part.output?.priceInfo) {
                                    return <CryptoPriceCard key={`crypto-price-card-${i}`} data={part.output.priceInfo} />
                                }
                            }
                            return null
                        })}
                        {trendingTokensParts.map((part, i) => {
                            if (part.state === 'executing' || part.state === 'requested') {
                                return <TrendingTokensSkeleton key={`trending-skeleton-${i}`} />
                            }
                            if (part.state === 'output-available') {
                                if (part.output?.success && part.output?.found) {
                                    return <TrendingTokensCard key={`trending-card-${i}`} data={part.output} activeNetwork={activeNetwork} />
                                }
                            }
                            return null
                        })}
                        {tokenInfoParts.map((part, i) => {
                            if (part.state === 'executing' || part.state === 'requested') {
                                return <TokenInfoSkeleton key={`token-skeleton-${i}`} />
                            }
                            if (part.state === 'output-available') {
                                const tokenData = part.output?.token
                                if (tokenData) {
                                    return <TokenInfoCard key={`token-card-${i}`} token={tokenData} activeNetwork={activeNetwork} />
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
                                return <TokenBalancesTable key={`token-balances-table-${i}`} data={part.output} activeNetwork={activeNetwork} />
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
                        {txHistoryParts.map((part, i) => {
                            if (part.state === 'executing' || part.state === 'requested') {
                                return <TxHistorySkeleton key={`tx-history-skeleton-${i}`} />
                            }
                            if (part.state === 'output-available' && part.output?.success === true) {
                                return <TxHistoryCard key={`tx-history-card-${i}`} data={part.output} />
                            }
                            return null
                        })}
                    </motion.div>
                )}
            </div>
        )
    }

    if (message.role === 'user') {
        return (
            <motion.div
                variants={slideInUp}
                className="flex flex-col items-end justify-end w-full gap-1"
            >
                <div className="bg-[#1e1e20] text-zinc-200 px-5 py-3 rounded-3xl max-w-[85%] text-[15px] leading-relaxed">
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
