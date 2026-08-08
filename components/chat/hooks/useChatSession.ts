'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useEveAgent } from 'eve/react'
import { addMessage, updateChatSession, createChat, updateChatModel, updateChatNetwork, markChatAsRead, compactEveSession, clearEveSession } from '../../../app/actions/chat/chat'
import { checkMyUsageQuota, getChatTokenUsageAction } from '../../../app/actions/usage/usage'
import { useWalletStore } from '../../../hooks/useWalletStore'
import { useAuthModalStore } from '../../../hooks/useAuthModalStore'
import { useChatActivityStore } from '../../../hooks/useChatActivityStore'
import { normalizeNetworkId } from '../../../lib/web3/config'
import { DEFAULT_MODEL_ID } from '../../../lib/models'
import { extractOnchainTransactions } from '../../../lib/chat/extractOnchainTransactions'
import {
    writePendingChatSend,
    peekPendingChatSend,
    consumePendingChatSend,
} from '../../../lib/pendingChatSend'
import {
    getStepMetrics,
    getToolMetrics,
    messageHasReasoning,
    messageHasTools,
} from '../AgentAnalysisPanel'
import {
    type PendingChatSend,
    type AnalysisPanelMode,
    type StoredMessage,
    type SessionState,
} from '@/types'

export const AGENT_ERROR_TEXT = 'Something went wrong'
export const API_KEY_ERROR_TEXT = 'Invalid API key provided. Please check your provider API key in Settings -> Providers.'

export function detectErrorMessage(err: any): string {
    if (!err) return AGENT_ERROR_TEXT
    const msg = typeof err === 'string'
        ? err
        : err.message || err.error || err.cause?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
    const lower = String(msg).toLowerCase()

    if (
        lower.includes('api key') ||
        lower.includes('apikey') ||
        lower.includes('invalid_api_key') ||
        lower.includes('incorrect api key') ||
        lower.includes('authenticationerror') ||
        lower.includes('unauthorized') ||
        lower.includes('401') ||
        lower.includes('invalid key') ||
        lower.includes('bad key') ||
        lower.includes('auth error')
    ) {
        if (typeof msg === 'string' && msg.includes('Settings -> Providers')) {
            return msg
        }
        return API_KEY_ERROR_TEXT
    }

    return AGENT_ERROR_TEXT
}

export function createAgentErrorParts(errorText: string = AGENT_ERROR_TEXT) {
    return [{ type: 'error' as const, text: errorText }]
}

function assistantHasUsefulContent(message: any | undefined): boolean {
    if (!message?.parts?.length) return false
    return message.parts.some((p: any) => {
        if (p.type === 'text' && typeof p.text === 'string' && p.text.trim().length > 0) return true
        if (p.type === 'dynamic-tool' && p.state === 'output-available') return true
        if (p.type === 'error') return true
        return false
    })
}

function titleFromMessages(messages: readonly { parts?: unknown }[]): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const parts = messages[i]?.parts
        if (!Array.isArray(parts)) continue
        for (const part of parts as any[]) {
            if (
                part?.type === 'dynamic-tool' &&
                typeof part.toolName === 'string' &&
                part.toolName.endsWith('update_chat_title') &&
                part.state === 'output-available' &&
                part.output?.success === true
            ) {
                const fromInput = typeof part.input?.title === 'string' ? part.input.title.trim() : ''
                if (fromInput) return fromInput
            }
        }
    }
    return null
}

export interface UseChatSessionProps {
    chatId: string | null
    initialMessages: StoredMessage[]
    initialSession: SessionState
    initialModel?: string
    initialTitle?: string
    activeNetwork: string
    userId: string | null
    enabledModels?: string[]
}

export function useChatSession({
    chatId: initialChatId,
    initialMessages,
    initialSession,
    initialModel,
    initialTitle = 'New Chat',
    activeNetwork,
    userId,
}: UseChatSessionProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [input, setInput] = useState('')
    const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>(initialMessages)
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId)
    const [isCreatingDb, setIsCreatingDb] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamStartIndex, setStreamStartIndex] = useState(0)
    const [analysisPanel, setAnalysisPanel] = useState<{ messageId: string; mode: AnalysisPanelMode } | null>(null)
    const [txPanelOpen, setTxPanelOpen] = useState(false)
    const [chatTitle, setChatTitle] = useState(initialTitle)
    const [totalTokens, setTotalTokens] = useState<number | null>(null)
    const [selectedModel, setSelectedModel] = useState(initialModel || DEFAULT_MODEL_ID)
    const [selectedNetwork, setSelectedNetwork] = useState<string>(normalizeNetworkId(activeNetwork))
    const [agentError, setAgentError] = useState(false)
    const [isCompacting, setIsCompacting] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    const loadWallets = useWalletStore(s => s.loadWallets)
    const openAuthModal = useAuthModalStore(s => s.open)

    useEffect(() => {
        if (userId) {
            void loadWallets(userId)
        }
    }, [userId, loadWallets])

    useEffect(() => {
        if (initialModel) {
            setSelectedModel(initialModel)
        }
    }, [initialModel])

    useEffect(() => {
        setChatTitle(initialTitle)
    }, [initialChatId, initialTitle])

    useEffect(() => {
        setSelectedNetwork(normalizeNetworkId(activeNetwork))
    }, [initialChatId, activeNetwork])

    const refreshChatTokens = useCallback(async (chatId: string | null) => {
        if (!chatId || !userId) {
            setTotalTokens(null)
            return
        }
        try {
            const usage = await getChatTokenUsageAction(chatId)
            setTotalTokens(usage.totalTokens)
        } catch (err) {
            console.warn('Failed to load chat token usage:', err)
        }
    }, [userId])

    useEffect(() => {
        if (!currentChatId || !userId) {
            setTotalTokens(null)
            return
        }
        setTotalTokens(null)
        void refreshChatTokens(currentChatId)
    }, [currentChatId, userId, refreshChatTokens])

    const handleModelChange = async (model: string) => {
        if (!model) return
        setSelectedModel(model)
        if (currentChatId) {
            await updateChatModel(currentChatId, model)
        }
    }

    const handleNetworkChange = useCallback(async (network: string) => {
        const safeNetwork = normalizeNetworkId(network)
        setSelectedNetwork(safeNetwork)
        if (currentChatId) {
            try {
                await updateChatNetwork(currentChatId, safeNetwork)
            } catch (err) {
                console.error('Failed to update chat network:', err)
            }
        }
    }, [currentChatId])

    const handleToggleAnalysis = useCallback((id: string, mode: AnalysisPanelMode) => {
        setTxPanelOpen(false)
        setAnalysisPanel(prev => {
            if (prev?.messageId === id && prev.mode === mode) return null
            return { messageId: id, mode }
        })
    }, [])

    const handleClosePanel = useCallback(() => {
        setAnalysisPanel(null)
    }, [])

    const handleOpenTransactions = useCallback(() => {
        setAnalysisPanel(null)
        setTxPanelOpen(true)
    }, [])

    const handleCloseTxPanel = useCallback(() => {
        setTxPanelOpen(false)
    }, [])

    const chatIdRef = useRef<string | null>(initialChatId)
    const streamStartIndexRef = useRef(0)
    const displayMessagesRef = useRef(displayMessages)
    const wasStoppedRef = useRef(false)

    useEffect(() => {
        chatIdRef.current = currentChatId
    }, [currentChatId])

    useEffect(() => {
        displayMessagesRef.current = displayMessages
    }, [displayMessages])

    useEffect(() => {
        setDisplayMessages(initialMessages)
        setCurrentChatId(initialChatId)
        chatIdRef.current = initialChatId
        setAgentError(false)
        setIsStreaming(false)
        setStreamStartIndex(0)
        streamStartIndexRef.current = 0
        setAnalysisPanel(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialChatId])

    const lastIsPersistedError = (msgs: StoredMessage[]) => {
        const last = msgs[msgs.length - 1]
        return (
            last?.role === 'assistant' &&
            last.content === AGENT_ERROR_TEXT &&
            Array.isArray(last.parts) &&
            (last.parts as any[]).some((p: any) => p.type === 'error')
        )
    }

    const persistTurn = useCallback(async (snapshot: any, forceError = false) => {
        const chatId = chatIdRef.current
        const allMessages: any[] = snapshot?.data?.messages ?? []
        const turnMessages = allMessages.slice(streamStartIndexRef.current)
        const lastUser = [...turnMessages].reverse().find((m: any) => m.role === 'user')
        const lastAssistant = [...turnMessages].reverse().find((m: any) => m.role === 'assistant')
        const pendingLocalUser = [...displayMessagesRef.current].reverse().find(
            m => m.role === 'user' && String(m.id).startsWith('local-user-')
        )

        const userText =
            lastUser?.parts?.find((p: any) => p.type === 'text')?.text ??
            pendingLocalUser?.content ??
            ''
        const assistantText = lastAssistant?.parts?.find((p: any) => p.type === 'text')?.text ?? ''
        const userParts = lastUser?.parts ?? pendingLocalUser?.parts ?? [{ type: 'text', text: userText }]

        const isTurnCancelled = wasStoppedRef.current
        wasStoppedRef.current = false

        if (isTurnCancelled) {
            setAgentError(false)
            const stoppedNotice = '_Response generation was stopped by user._'
            const existingText = assistantText.trim()
            const finalContent = existingText ? `${existingText}\n\n${stoppedNotice}` : stoppedNotice

            const finalParts: any[] = lastAssistant?.parts ? [...lastAssistant.parts] : []
            const lastTextIdx = finalParts.findLastIndex((p: any) => p.type === 'text')
            if (lastTextIdx >= 0) {
                finalParts[lastTextIdx] = {
                    ...finalParts[lastTextIdx],
                    text: `${finalParts[lastTextIdx].text}\n\n${stoppedNotice}`.trim()
                }
            } else {
                finalParts.push({ type: 'text', text: stoppedNotice })
            }

            const stoppedMessageId = lastAssistant?.id || `stopped-${Date.now()}`

            setDisplayMessages(prev => {
                const idx = prev.findIndex(m => m.id === stoppedMessageId)
                const stoppedMsg: StoredMessage = {
                    id: stoppedMessageId,
                    role: 'assistant',
                    content: finalContent,
                    parts: finalParts,
                    createdAt: lastAssistant?.createdAt ?? new Date(),
                }
                if (idx >= 0) {
                    const next = [...prev]
                    next[idx] = stoppedMsg
                    return next
                }
                return [...prev, stoppedMsg]
            })

            setIsStreaming(false)

            if (!chatId) return

            try {
                const hadUserThisTurn = Boolean(lastUser) || Boolean(pendingLocalUser)
                if (userText && hadUserThisTurn) {
                    const pendingLocal = displayMessagesRef.current.find(
                        m =>
                            m.role === 'user' &&
                            m.content === userText &&
                            String(m.id).startsWith('local-user-')
                    )
                    if (pendingLocal) {
                        const savedUser = await addMessage(chatId, 'user', userText, userParts)
                        setDisplayMessages(prev => {
                            const localIdx = prev.findIndex(m => m.id === pendingLocal.id)
                            const saved: StoredMessage = {
                                id: savedUser.id,
                                role: 'user',
                                content: userText,
                                parts: userParts,
                                createdAt: savedUser.createdAt,
                            }
                            if (localIdx >= 0) {
                                const next = [...prev]
                                next[localIdx] = saved
                                return next
                            }
                            if (prev.some(m => m.id === savedUser.id)) return prev
                            return [...prev, saved]
                        })
                    }
                }

                await addMessage(chatId, 'assistant', finalContent, finalParts)
                const session = snapshot?.session
                if (session?.sessionId) {
                    await updateChatSession(
                        chatId,
                        session.sessionId,
                        session.streamIndex ?? 0
                    )
                }
                if (chatId && pathname === `/chat/${chatId}`) {
                    await markChatAsRead(chatId).catch(() => { })
                }
                void refreshChatTokens(chatId)
                router.refresh()
            } catch (err) {
                console.error('Failed to persist stopped turn:', err)
            }
            return
        }

        const explicitError =
            forceError ||
            snapshot?.status === 'error' ||
            Boolean(snapshot?.error) ||
            lastUser?.metadata?.status === 'failed'

        const hadUserThisTurn = Boolean(lastUser) || Boolean(pendingLocalUser)
        const silentFailure = hadUserThisTurn && !assistantHasUsefulContent(lastAssistant)
        const turnFailed = explicitError || silentFailure

        if (turnFailed) {
            setAgentError(true)
        }

        let enrichedParts = lastAssistant?.parts
        if (!turnFailed && enrichedParts && snapshot?.events) {
            enrichedParts = lastAssistant.parts.map((p: any) => {
                if (p.type === 'reasoning') {
                    const stepIndex = p.stepIndex
                    const startedEvent = snapshot.events.find(
                        (e: any) => e.type === 'step.started' && e.data?.stepIndex === stepIndex
                    )
                    const completedEvent = snapshot.events.find(
                        (e: any) => e.type === 'step.completed' && e.data?.stepIndex === stepIndex
                    )
                    if (startedEvent) {
                        const metrics: any = {}
                        const started = startedEvent as any
                        const completed = completedEvent as any
                        if (completedEvent) {
                            if (completed.meta?.at && started.meta?.at) {
                                metrics.durationMs = new Date(completed.meta.at).getTime() - new Date(started.meta.at).getTime()
                            }
                            if (completed.data?.usage) {
                                metrics.inputTokens = completed.data.usage.inputTokens
                                metrics.outputTokens = completed.data.usage.outputTokens
                                metrics.cacheReadTokens = completed.data.usage.cacheReadTokens
                                metrics.cacheWriteTokens = completed.data.usage.cacheWriteTokens
                            }
                        }
                        return { ...p, metrics }
                    }
                }
                if (p.type === 'dynamic-tool') {
                    const toolCallId = p.toolCallId
                    const requestEvent = snapshot.events.find(
                        (e: any) => e.type === 'actions.requested' && e.data?.actions?.some((a: any) => a.callId === toolCallId)
                    )
                    const resultEvent = snapshot.events.find(
                        (e: any) => e.type === 'action.result' && e.data?.result?.callId === toolCallId
                    )
                    if (requestEvent) {
                        const metrics: any = {}
                        const req = requestEvent as any
                        const res = resultEvent as any
                        if (resultEvent) {
                            if (res.meta?.at && req.meta?.at) {
                                metrics.durationMs = new Date(res.meta.at).getTime() - new Date(req.meta.at).getTime()
                            }
                        }
                        return { ...p, metrics }
                    }
                }
                return p
            })
        }

        const localErrorId = `local-error-${Date.now()}`
        const rawErr = snapshot?.error || agentRef.current?.error || (snapshot?.data as any)?.error
        const errorText = detectErrorMessage(rawErr)
        const errorParts = createAgentErrorParts(errorText)

        setDisplayMessages(prev => {
            let next = prev

            if (turnFailed) {
                if (!lastIsPersistedError(next)) {
                    next = [...next, {
                        id: localErrorId,
                        role: 'assistant' as const,
                        content: errorText,
                        parts: errorParts,
                        createdAt: new Date(),
                    }]
                }
            } else if (lastAssistant && assistantHasUsefulContent(lastAssistant)) {
                if (!next.some(m => m.id === lastAssistant.id)) {
                    next = [...next, {
                        id: lastAssistant.id,
                        role: 'assistant' as const,
                        content: assistantText,
                        parts: enrichedParts,
                        createdAt: lastAssistant.createdAt ?? new Date(),
                    } as StoredMessage]
                }
            }

            return next
        })

        setIsStreaming(false)

        if (!chatId) return

        try {
            if (userText && hadUserThisTurn) {
                const pendingLocal = displayMessagesRef.current.find(
                    m =>
                        m.role === 'user' &&
                        m.content === userText &&
                        String(m.id).startsWith('local-user-')
                )
                if (pendingLocal) {
                    const savedUser = await addMessage(chatId, 'user', userText, userParts)
                    setDisplayMessages(prev => {
                        const localIdx = prev.findIndex(m => m.id === pendingLocal.id)
                        const saved: StoredMessage = {
                            id: savedUser.id,
                            role: 'user',
                            content: userText,
                            parts: userParts,
                            createdAt: savedUser.createdAt,
                        }
                        if (localIdx >= 0) {
                            const next = [...prev]
                            next[localIdx] = saved
                            return next
                        }
                        if (prev.some(m => m.id === savedUser.id)) return prev
                        return [...prev, saved]
                    })
                }
            }

            if (turnFailed) {
                const alreadyHasDbError = displayMessagesRef.current.some(
                    m =>
                        m.role === 'assistant' &&
                        (m.content === errorText || m.content === AGENT_ERROR_TEXT) &&
                        Array.isArray(m.parts) &&
                        (m.parts as any[]).some((p: any) => p.type === 'error') &&
                        !String(m.id).startsWith('local-error-')
                )

                if (!alreadyHasDbError) {
                    await addMessage(chatId, 'assistant', errorText, errorParts)
                }
            } else if (lastAssistant && assistantHasUsefulContent(lastAssistant)) {
                await addMessage(
                    chatId,
                    'assistant',
                    assistantText || '',
                    enrichedParts
                )
            }

            const session = snapshot?.session
            if (session?.sessionId) {
                await updateChatSession(
                    chatId,
                    session.sessionId,
                    session.streamIndex ?? 0
                )
            }

            if (chatId && pathname === `/chat/${chatId}`) {
                await markChatAsRead(chatId).catch(() => { })
            }
            void refreshChatTokens(chatId)
            router.refresh()
        } catch (err) {
            console.error('Failed to persist chat turn:', err)
            setAgentError(true)
            setDisplayMessages(prev => {
                if (lastIsPersistedError(prev)) return prev
                return [...prev, {
                    id: `local-error-${Date.now()}`,
                    role: 'assistant' as const,
                    content: AGENT_ERROR_TEXT,
                    parts: createAgentErrorParts(),
                    createdAt: new Date(),
                }]
            })
        }
    }, [router, refreshChatTokens, pathname])

    const setChatRunning = useChatActivityStore((s) => s.setChatRunning)

    useEffect(() => {
        if (currentChatId) {
            void markChatAsRead(currentChatId).catch(() => { })
        }
    }, [currentChatId])

    const agent = useEveAgent({
        initialSession: initialSession.sessionId
            ? {
                sessionId: initialSession.sessionId,
                streamIndex: initialSession.streamIndex ?? 0,
            }
            : undefined,
        onError: useCallback(() => {
            if (chatIdRef.current) {
                setChatRunning(chatIdRef.current, false)
            }
            setIsStreaming(false)
            setAgentError(true)
        }, [setChatRunning]),
        onFinish: useCallback(async (snapshot: any) => {
            if (chatIdRef.current) {
                setChatRunning(chatIdRef.current, false)
            }
            await persistTurn(snapshot, false)
        }, [persistTurn, setChatRunning])
    })

    const agentRef = useRef<typeof agent>(null as unknown as typeof agent)
    useEffect(() => {
        agentRef.current = agent
    }, [agent])

    const handleStop = useCallback(async () => {
        wasStoppedRef.current = true
        setAgentError(false)
        const targetChatId = chatIdRef.current
        const activeSessionId = agentRef.current.session?.sessionId || initialSession?.sessionId

        if (activeSessionId) {
            try {
                const res = await fetch(`/eve/v1/session/${encodeURIComponent(activeSessionId)}/cancel`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                })
                if (!res.ok) {
                    console.warn('Server cancel route returned non-ok status, resetting client session.')
                    agentRef.current.reset()
                    void persistTurn(agentRef.current, false)
                }
            } catch (err) {
                console.warn('Failed to cancel Eve session turn on server:', err)
                agentRef.current.reset()
                void persistTurn(agentRef.current, false)
            }
        } else {
            agentRef.current.reset()
            void persistTurn(agentRef.current, false)
        }

        if (targetChatId) {
            setChatRunning(targetChatId, false)
        }
        setIsStreaming(false)
    }, [initialSession, persistTurn, setChatRunning])

    const runAgentSend = useCallback(async (opts: {
        messageText: string
        targetChatId: string
        model: string
        network: string
        wallet: string
        userAlreadyShown: boolean
        localUserId?: string
        userSavedToDb?: boolean
    }) => {
        const {
            messageText,
            targetChatId,
            model,
            network,
            wallet,
            userAlreadyShown,
        } = opts
        let { localUserId, userSavedToDb = false } = opts
        const userParts = [{ type: 'text', text: messageText }]

        setAgentError(false)
        const nextStreamStart = agentRef.current.data?.messages?.length || 0
        streamStartIndexRef.current = nextStreamStart
        setStreamStartIndex(nextStreamStart)
        setIsStreaming(true)
        setChatRunning(targetChatId, true)

        if (!userAlreadyShown) {
            localUserId = localUserId ?? `local-user-${Date.now()}`
            setDisplayMessages(prev => [...prev, {
                id: localUserId!,
                role: 'user',
                content: messageText,
                parts: userParts,
                createdAt: new Date(),
            }])

            try {
                const savedUser = await addMessage(targetChatId, 'user', messageText, userParts)
                userSavedToDb = true
                setDisplayMessages(prev => {
                    const idx = prev.findIndex(m => m.id === localUserId)
                    const saved: StoredMessage = {
                        id: savedUser.id,
                        role: 'user',
                        content: messageText,
                        parts: userParts,
                        createdAt: savedUser.createdAt,
                    }
                    if (idx >= 0) {
                        const next = [...prev]
                        next[idx] = saved
                        return next
                    }
                    if (prev.some(m => m.id === savedUser.id)) return prev
                    return [...prev, saved]
                })
            } catch (persistUserErr) {
                console.error('Failed to persist user message on send:', persistUserErr)
            }
        } else {
            setDisplayMessages(prev => {
                const hasSame = prev.some(
                    m => m.role === 'user' && m.content === messageText
                )
                if (hasSame) return prev
                return [...prev, {
                    id: `local-user-${Date.now()}`,
                    role: 'user' as const,
                    content: messageText,
                    parts: userParts,
                    createdAt: new Date(),
                }]
            })
            userSavedToDb = true
        }

        try {
            await agentRef.current.send(messageText, {
                headers: {
                    'x-model-name': model,
                    'x-chat-id': targetChatId,
                    'x-active-network': network,
                    'x-active-wallet': wallet,
                    'x-timezone':
                        typeof Intl !== 'undefined'
                            ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
                            : '',
                }
            })
        } catch (sendErr: any) {
            setChatRunning(targetChatId, false)
            setIsStreaming(false)
            setAgentError(true)
            try {
                if (!userSavedToDb && localUserId) {
                    const stillLocal = displayMessagesRef.current.some(m => m.id === localUserId)
                    if (stillLocal) {
                        const savedUser = await addMessage(targetChatId, 'user', messageText, userParts)
                        setDisplayMessages(prev => {
                            const idx = prev.findIndex(m => m.id === localUserId)
                            const saved: StoredMessage = {
                                id: savedUser.id,
                                role: 'user',
                                content: messageText,
                                parts: userParts,
                                createdAt: savedUser.createdAt,
                            }
                            if (idx >= 0) {
                                const next = [...prev]
                                next[idx] = saved
                                return next
                            }
                            if (prev.some(m => m.id === savedUser.id)) return prev
                            return [...prev, saved]
                        })
                    }
                }

                const rawErr = sendErr || agentRef.current?.error || (agentRef.current?.data as any)?.error
                const errorMsg = detectErrorMessage(rawErr)
                const errorParts = createAgentErrorParts(errorMsg)
                const savedError = await addMessage(targetChatId, 'assistant', errorMsg, errorParts)
                setDisplayMessages(prev => {
                    if (
                        prev[prev.length - 1]?.role === 'assistant' &&
                        (prev[prev.length - 1]?.content === errorMsg || prev[prev.length - 1]?.content === AGENT_ERROR_TEXT)
                    ) {
                        return prev
                    }
                    return [...prev, {
                        id: savedError.id,
                        role: 'assistant' as const,
                        content: errorMsg,
                        parts: errorParts,
                        createdAt: savedError.createdAt,
                    }]
                })
            } catch (persistErr) {
                console.error('Failed to persist error turn:', persistErr)
                const rawErr = sendErr || agentRef.current?.error
                const errorMsg = detectErrorMessage(rawErr)
                const errorParts = createAgentErrorParts(errorMsg)
                setDisplayMessages(prev => {
                    if (prev[prev.length - 1]?.content === errorMsg || prev[prev.length - 1]?.content === AGENT_ERROR_TEXT) return prev
                    return [...prev, {
                        id: `local-error-${Date.now()}`,
                        role: 'assistant',
                        content: errorMsg,
                        parts: errorParts,
                        createdAt: new Date(),
                    }]
                })
            }
        }
    }, [persistTurn, setChatRunning])

    useEffect(() => {
        if (!initialChatId || !userId) return

        const peeked = peekPendingChatSend(initialChatId)
        if (!peeked) return

        let cancelled = false

        const timer = window.setTimeout(() => {
            if (cancelled) return
            const pending = consumePendingChatSend(initialChatId)
            if (!pending) return

            void runAgentSend({
                messageText: pending.message ?? '',
                targetChatId: pending.chatId ?? '',
                model: pending.model || selectedModel,
                network: pending.network ?? '',
                wallet: pending.wallet ?? '',
                userAlreadyShown: true,
            })
        }, 0)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [initialChatId, userId, runAgentSend, selectedModel])

    const isBusy =
        agent.status !== 'error' &&
        (agent.status === 'submitted' || agent.status === 'streaming' || isCreatingDb || isStreaming)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!input.trim() || isBusy) return
        if (!userId) {
            openAuthModal()
            return
        }

        try {
            const timeZone =
                typeof Intl !== 'undefined'
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : undefined
            const quota = await checkMyUsageQuota(timeZone)
            if (quota.blocked) {
                const reason =
                    quota.reasons[0] ||
                    "You've reached today's AI usage limit."
                setDisplayMessages(prev => {
                    const last = prev[prev.length - 1] as StoredMessage | undefined
                    const lastIsSameLimit =
                        last?.role === 'system' &&
                        Array.isArray(last.parts) &&
                        (last.parts as any[]).some((p: any) => p.type === 'usage-limit')
                    if (lastIsSameLimit) return prev
                    return [
                        ...prev,
                        {
                            id: `local-quota-${Date.now()}`,
                            role: 'system',
                            content: reason,
                            parts: [{
                                type: 'usage-limit',
                                title: 'Limit reached',
                                text: reason,
                                resetsIn: quota.resetsInLabel,
                            }],
                            createdAt: new Date(),
                        },
                    ]
                })
                return
            }
        } catch (quotaErr) {
            console.warn('Usage quota check failed:', quotaErr)
        }

        const messageText = input.trim()
        const activeWallet = useWalletStore.getState().selectedAddress || ''
        const networkForTurn = selectedNetwork

        if (!currentChatId) {
            setIsCreatingDb(true)
            setAgentError(false)
            try {
                const chat = await createChat(selectedModel, selectedNetwork)
                const targetChatId = chat.id
                const userParts = [{ type: 'text', text: messageText }]

                await addMessage(targetChatId, 'user', messageText, userParts)

                writePendingChatSend({
                    chatId: targetChatId,
                    message: messageText,
                    model: selectedModel,
                    network: networkForTurn,
                    wallet: activeWallet,
                    createdAt: Date.now(),
                } satisfies PendingChatSend)

                setInput('')
                router.replace(`/chat/${targetChatId}`)
            } catch (err) {
                console.error('Failed to start new chat:', err)
                setAgentError(true)
            } finally {
                setIsCreatingDb(false)
            }
            return
        }

        setInput('')
        await runAgentSend({
            messageText,
            targetChatId: currentChatId,
            model: selectedModel,
            network: networkForTurn,
            wallet: activeWallet,
            userAlreadyShown: false,
        })
    }

    const mappedDisplayMessages = useMemo(() => {
        return displayMessages.map(m => ({
            id: m.id,
            role: m.role,
            parts: m.parts ?? [{ type: 'text', text: m.content }],
            createdAt: m.createdAt
        }))
    }, [displayMessages])

    const displayIds = useMemo(() => new Set(displayMessages.map(m => m.id)), [displayMessages])
    const showStreamOverlay =
        isStreaming ||
        agent.status === 'streaming' ||
        agent.status === 'submitted'

    const streamMessages = useMemo(() => {
        return showStreamOverlay
            ? (agent.data?.messages?.slice(streamStartIndex) || []).filter(
                (m: any) => m.role !== 'user' && !displayIds.has(m.id)
            )
            : []
    }, [showStreamOverlay, agent.data?.messages, streamStartIndex, displayIds])

    const messages = useMemo(() => [...mappedDisplayMessages, ...streamMessages] as any[], [
        mappedDisplayMessages,
        streamMessages,
    ])

    const activeMessage = useMemo(() => {
        if (!analysisPanel) return null
        return messages.find((m: any) => m.id === analysisPanel.messageId) || null
    }, [analysisPanel, messages])

    const panelMode = useMemo(() => {
        if (!analysisPanel || !activeMessage) return null
        if (analysisPanel.mode === 'reasoning' && messageHasReasoning(activeMessage)) {
            return 'reasoning' as const
        }
        if (analysisPanel.mode === 'tools' && messageHasTools(activeMessage)) {
            return 'tools' as const
        }
        return null
    }, [analysisPanel, activeMessage])

    const activeMessageId = useMemo(() => (panelMode ? analysisPanel?.messageId ?? null : null), [
        panelMode,
        analysisPanel,
    ])

    const enrichedMessages = useMemo(() => {
        return messages.map((m: any) => {
            if (m.role !== 'assistant') return m

            let totalDurationMs = 0
            let totalTokensUsed = 0
            let hasMetrics = false

            m.parts?.forEach((p: any) => {
                if (p.metrics) {
                    hasMetrics = true
                    if (p.metrics.durationMs) totalDurationMs += p.metrics.durationMs
                    if (p.metrics.inputTokens) totalTokensUsed += p.metrics.inputTokens
                    if (p.metrics.outputTokens) totalTokensUsed += p.metrics.outputTokens
                } else {
                    if (p.type === 'reasoning') {
                        const stepMetrics = getStepMetrics(p.stepIndex, agent.events)
                        if (stepMetrics) {
                            hasMetrics = true
                            if (stepMetrics.durationMs) totalDurationMs += stepMetrics.durationMs
                            if (stepMetrics.inputTokens) totalTokensUsed += stepMetrics.inputTokens
                            if (stepMetrics.outputTokens) totalTokensUsed += stepMetrics.outputTokens
                        }
                    } else if (p.type === 'dynamic-tool') {
                        const toolMetrics = getToolMetrics(p.toolCallId, agent.events)
                        if (toolMetrics) {
                            hasMetrics = true
                            if (toolMetrics.durationMs) totalDurationMs += toolMetrics.durationMs
                        }
                    }
                }
            })

            if (hasMetrics) {
                return {
                    ...m,
                    aggregateMetrics: {
                        durationMs: totalDurationMs,
                        totalTokens: totalTokensUsed,
                    }
                }
            }
            return m
        })
    }, [messages, agent.events])

    const onchainTxs = useMemo(
        () => extractOnchainTransactions(enrichedMessages),
        [enrichedMessages]
    )

    useEffect(() => {
        const liveTitle = titleFromMessages(enrichedMessages)
        if (liveTitle) setChatTitle(liveTitle)
    }, [enrichedMessages])

    const handleCompactContext = useCallback(async () => {
        if (!currentChatId || isCompacting || isBusy) return
        setIsCompacting(true)
        try {
            agentRef.current.reset()
            const noticeMsg = await compactEveSession(currentChatId)
            if (noticeMsg) {
                setDisplayMessages(prev => [...prev, noticeMsg as StoredMessage])
            }
        } catch (err) {
            console.error('Failed to compact context:', err)
        } finally {
            setIsCompacting(false)
        }
    }, [currentChatId, isCompacting, isBusy])

    const handleClearContext = useCallback(async () => {
        if (!currentChatId || isClearing || isBusy) return
        setIsClearing(true)
        try {
            agentRef.current.reset()
            const noticeMsg = await clearEveSession(currentChatId)
            setDisplayMessages(noticeMsg ? [noticeMsg as StoredMessage] : [])
            setTotalTokens(0)
        } catch (err) {
            console.error('Failed to clear context:', err)
        } finally {
            setIsClearing(false)
        }
    }, [currentChatId, isClearing, isBusy])

    return {
        input,
        setInput,
        messages,
        enrichedMessages,
        totalTokens,
        selectedModel,
        selectedNetwork,
        isBusy,
        isCompacting,
        isClearing,
        agentError: agentError || agent.status === 'error',
        txPanelOpen,
        chatTitle,
        panelMode,
        activeMessage,
        activeMessageId,
        onchainTxs,
        agentEvents: agent.events,
        handleSubmit,
        handleModelChange,
        handleNetworkChange,
        handleToggleAnalysis,
        handleClosePanel,
        handleOpenTransactions,
        handleCloseTxPanel,
        handleStop,
        handleCompactContext,
        handleClearContext,
    }
}
