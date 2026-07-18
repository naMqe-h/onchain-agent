'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEveAgent } from 'eve/react'
import { AnimatePresence } from 'framer-motion'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import AgentAnalysisPanel, { getStepMetrics, getToolMetrics } from './AgentAnalysisPanel'
import { addMessage, updateChatSession, createChat, updateChatModel } from '../../app/actions/chat/chat'
import { useWalletStore } from '../../hooks/useWalletStore'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { createClient } from '../../lib/supabase/client'
import { normalizeNetworkId } from '../../lib/web3/config'
import { DEFAULT_MODEL_ID, isSupportedModelId } from '../../lib/models'
import {
    writePendingChatSend,
    peekPendingChatSend,
    consumePendingChatSend,
    type PendingChatSend,
} from '../../lib/pendingChatSend'

export const AGENT_ERROR_TEXT = 'Something went wrong'

export function createAgentErrorParts() {
    return [{ type: 'error' as const, text: AGENT_ERROR_TEXT }]
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

interface SessionState {
    sessionId?: string
    continuationToken?: string
    streamIndex: number
}

interface StoredMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    parts: unknown
    createdAt: Date
}

interface ChatProps {
    chatId: string | null
    initialMessages: StoredMessage[]
    initialSession: SessionState
    initialModel?: string
    activeNetwork: string
    userId: string | null
    enabledModels?: string[]
}

export default function Chat({ chatId: initialChatId, initialMessages, initialSession, initialModel, activeNetwork, userId, enabledModels }: ChatProps) {
    const router = useRouter()
    const [input, setInput] = useState('')
    const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>(initialMessages)
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId)
    const [isCreatingDb, setIsCreatingDb] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamStartIndex, setStreamStartIndex] = useState(0)
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState(initialModel || DEFAULT_MODEL_ID)
    const [agentError, setAgentError] = useState(false)

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

    const handleModelChange = async (model: string) => {
        if (!isSupportedModelId(model)) return
        setSelectedModel(model)
        if (currentChatId) {
            await updateChatModel(currentChatId, model)
        }
    }

    const handleToggleReasoning = useCallback((id: string) => {
        setActiveMessageId(prev => prev === id ? null : id)
    }, [])

    const handleClosePanel = useCallback(() => {
        setActiveMessageId(null)
    }, [])

    const chatIdRef = useRef<string | null>(initialChatId)
    const streamStartIndexRef = useRef(0)
    const displayMessagesRef = useRef(displayMessages)

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
        setActiveMessageId(null)
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
        const errorParts = createAgentErrorParts()

        setDisplayMessages(prev => {
            let next = prev

            if (turnFailed) {
                if (!lastIsPersistedError(next)) {
                    next = [...next, {
                        id: localErrorId,
                        role: 'assistant' as const,
                        content: AGENT_ERROR_TEXT,
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
                        m.content === AGENT_ERROR_TEXT &&
                        Array.isArray(m.parts) &&
                        (m.parts as any[]).some((p: any) => p.type === 'error') &&
                        !String(m.id).startsWith('local-error-')
                )

                if (!alreadyHasDbError) {
                    await addMessage(chatId, 'assistant', AGENT_ERROR_TEXT, errorParts)
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
                    session.continuationToken ?? '',
                    session.streamIndex ?? 0
                )
            }

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
    }, [router])

    const agent = useEveAgent({
        initialSession,
        onError: useCallback(() => {
            setIsStreaming(false)
            setAgentError(true)
        }, []),
        onFinish: useCallback(async (snapshot: any) => {
            await persistTurn(snapshot, false)
        }, [persistTurn])
    })

    const agentRef = useRef(agent)
    useEffect(() => {
        agentRef.current = agent
    }, [agent])

    const resolveNetworkForTurn = useCallback(async () => {
        let networkForTurn = normalizeNetworkId(activeNetwork)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.activeNetwork) {
                networkForTurn = normalizeNetworkId(user.user_metadata.activeNetwork)
            }
        } catch { }
        return networkForTurn
    }, [activeNetwork])

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
            await agentRef.current.send({
                message: messageText,
                headers: {
                    'x-model-name': model,
                    'x-chat-id': targetChatId,
                    'x-active-network': network,
                    'x-active-wallet': wallet,
                }
            })
        } catch {
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

                const errorParts = createAgentErrorParts()
                const savedError = await addMessage(targetChatId, 'assistant', AGENT_ERROR_TEXT, errorParts)
                setDisplayMessages(prev => {
                    if (
                        prev[prev.length - 1]?.role === 'assistant' &&
                        prev[prev.length - 1]?.content === AGENT_ERROR_TEXT
                    ) {
                        return prev
                    }
                    return [...prev, {
                        id: savedError.id,
                        role: 'assistant' as const,
                        content: AGENT_ERROR_TEXT,
                        parts: errorParts,
                        createdAt: savedError.createdAt,
                    }]
                })
            } catch (persistErr) {
                console.error('Failed to persist error turn:', persistErr)
                setDisplayMessages(prev => {
                    if (prev[prev.length - 1]?.content === AGENT_ERROR_TEXT) return prev
                    return [...prev, {
                        id: `local-error-${Date.now()}`,
                        role: 'assistant',
                        content: AGENT_ERROR_TEXT,
                        parts: createAgentErrorParts(),
                        createdAt: new Date(),
                    }]
                })
            }
        }
    }, [])

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
                messageText: pending.message,
                targetChatId: pending.chatId,
                model: pending.model || selectedModel,
                network: pending.network,
                wallet: pending.wallet,
                userAlreadyShown: true,
            })
        }, 0)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [initialChatId, userId, runAgentSend])

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

        const messageText = input.trim()
        const activeWallet = useWalletStore.getState().selectedAddress || ''
        const networkForTurn = await resolveNetworkForTurn()

        if (!currentChatId) {
            setIsCreatingDb(true)
            setAgentError(false)
            try {
                const chat = await createChat(selectedModel)
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

    const mappedDisplayMessages = displayMessages.map(m => ({
        id: m.id,
        role: m.role,
        parts: m.parts ?? [{ type: 'text', text: m.content }],
        createdAt: m.createdAt
    }))

    const displayIds = new Set(displayMessages.map(m => m.id))
    const showStreamOverlay =
        isStreaming ||
        agent.status === 'streaming' ||
        agent.status === 'submitted'
    const streamMessages = showStreamOverlay
        ? (agent.data?.messages?.slice(streamStartIndex) || []).filter(
            (m: any) => m.role !== 'user' && !displayIds.has(m.id)
        )
        : []

    const messages = [...mappedDisplayMessages, ...streamMessages] as any

    const activeMessage = activeMessageId ? messages.find((m: any) => m.id === activeMessageId) : null

    const enrichedMessages = messages.map((m: any) => {
        if (m.role !== 'assistant') return m

        let totalDurationMs = 0
        let totalTokens = 0
        let hasMetrics = false

        m.parts?.forEach((p: any) => {
            if (p.metrics) {
                hasMetrics = true
                if (p.metrics.durationMs) totalDurationMs += p.metrics.durationMs
                if (p.metrics.inputTokens) totalTokens += p.metrics.inputTokens
                if (p.metrics.outputTokens) totalTokens += p.metrics.outputTokens
            } else {
                if (p.type === 'reasoning') {
                    const stepMetrics = getStepMetrics(p.stepIndex, agent.events)
                    if (stepMetrics) {
                        hasMetrics = true
                        if (stepMetrics.durationMs) totalDurationMs += stepMetrics.durationMs
                        if (stepMetrics.inputTokens) totalTokens += stepMetrics.inputTokens
                        if (stepMetrics.outputTokens) totalTokens += stepMetrics.outputTokens
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
                    totalTokens: totalTokens
                }
            }
        }
        return m
    })

    return (
        <div className="relative flex h-full w-full bg-[#131314] overflow-hidden">
            <div className="flex-1 flex flex-col h-full min-w-0">
                <ChatMessagesList
                    chatId={currentChatId}
                    messages={enrichedMessages}
                    activeMessageId={activeMessageId}
                    onToggleReasoning={handleToggleReasoning}
                    isBusy={isBusy}
                    showError={agentError || agent.status === 'error'}
                />
                <div className="w-full">
                    <ChatInput
                        input={input}
                        handleInputChange={(e) => setInput(e.target.value)}
                        handleSubmit={handleSubmit}
                        isBusy={isBusy}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                        enabledModels={enabledModels}
                        isAuthenticated={!!userId}
                    />
                </div>
            </div>

            <AnimatePresence>
                {activeMessage && (
                    <AgentAnalysisPanel
                        activeMessage={activeMessage}
                        onClose={handleClosePanel}
                        agentEvents={agent.events}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
