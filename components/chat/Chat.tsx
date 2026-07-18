'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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

    useEffect(() => {
        setDisplayMessages(initialMessages)
    }, [initialMessages])

    const chatIdRef = useRef<string | null>(initialChatId)
    useEffect(() => {
        chatIdRef.current = currentChatId
    }, [currentChatId])

    const displayMessagesRef = useRef(displayMessages)
    useEffect(() => {
        displayMessagesRef.current = displayMessages
    }, [displayMessages])

    const streamStartIndexRef = useRef(0)

    const persistTurn = useCallback(async (snapshot: any, forceError = false) => {
        setIsStreaming(false)

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

        if (!chatId) return

        const lastIsPersistedError = (msgs: StoredMessage[]) => {
            const last = msgs[msgs.length - 1]
            return (
                last?.role === 'assistant' &&
                last.content === AGENT_ERROR_TEXT &&
                Array.isArray(last.parts) &&
                (last.parts as any[]).some((p: any) => p.type === 'error')
            )
        }

        try {
            if (userText && hadUserThisTurn) {
                const alreadyPersisted = displayMessagesRef.current.some(
                    m => m.role === 'user' && m.content === userText && !String(m.id).startsWith('local-user-')
                )

                if (!alreadyPersisted) {
                    const savedUser = await addMessage(chatId, 'user', userText, userParts)
                    setDisplayMessages(prev => {
                        const localIdx = prev.findIndex(
                            m =>
                                (lastUser && m.id === lastUser.id) ||
                                (m.role === 'user' && m.content === userText && String(m.id).startsWith('local-user-'))
                        )
                        const saved = {
                            id: savedUser.id,
                            role: 'user' as const,
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
                if (!lastIsPersistedError(displayMessagesRef.current)) {
                    const errorParts = createAgentErrorParts()
                    const savedError = await addMessage(chatId, 'assistant', AGENT_ERROR_TEXT, errorParts)
                    setDisplayMessages(prev => {
                        if (lastIsPersistedError(prev)) return prev
                        return [...prev, {
                            id: savedError.id,
                            role: 'assistant' as const,
                            content: AGENT_ERROR_TEXT,
                            parts: errorParts,
                            createdAt: savedError.createdAt,
                        }]
                    })
                }
            } else if (lastAssistant && assistantHasUsefulContent(lastAssistant)) {
                setDisplayMessages(prev => {
                    if (prev.find(m => m.id === lastAssistant.id)) return prev
                    return [...prev, {
                        ...lastAssistant,
                        content: assistantText,
                        parts: enrichedParts,
                        createdAt: lastAssistant.createdAt ?? new Date(),
                    } as any]
                })
                if (assistantText) {
                    await addMessage(chatId, 'assistant', assistantText, enrichedParts)
                }
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
    }, [])

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

        setAgentError(false)
        const nextStreamStart = agent.data?.messages?.length || 0
        streamStartIndexRef.current = nextStreamStart
        setStreamStartIndex(nextStreamStart)
        setIsStreaming(true)

        let targetChatId = currentChatId
        if (!targetChatId) {
            setIsCreatingDb(true)
            try {
                const chat = await createChat(selectedModel)
                targetChatId = chat.id
                setCurrentChatId(chat.id)
                chatIdRef.current = chat.id
                window.history.replaceState(null, '', `/chat/${chat.id}`)
            } catch {
                setIsStreaming(false)
                setAgentError(true)
                setIsCreatingDb(false)
                return
            } finally {
                setIsCreatingDb(false)
            }
        }

        const activeWallet = useWalletStore.getState().selectedAddress || ''

        let networkForTurn = normalizeNetworkId(activeNetwork)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.activeNetwork) {
                networkForTurn = normalizeNetworkId(user.user_metadata.activeNetwork)
            }
        } catch { }

        const messageText = input.trim()
        setInput('')

        const localUserId = `local-user-${Date.now()}`
        const userParts = [{ type: 'text', text: messageText }]
        setDisplayMessages(prev => [...prev, {
            id: localUserId,
            role: 'user',
            content: messageText,
            parts: userParts,
            createdAt: new Date(),
        }])

        try {
            await agent.send({
                message: messageText,
                headers: {
                    'x-model-name': selectedModel,
                    'x-chat-id': targetChatId || '',
                    'x-active-network': networkForTurn,
                    'x-active-wallet': activeWallet,
                }
            })
        } catch {
            setIsStreaming(false)
            setAgentError(true)
            if (targetChatId) {
                try {
                    const savedUser = await addMessage(targetChatId, 'user', messageText, userParts)
                    const errorParts = createAgentErrorParts()
                    const savedError = await addMessage(targetChatId, 'assistant', AGENT_ERROR_TEXT, errorParts)
                    setDisplayMessages(prev => {
                        const withoutLocal = prev.filter(m => m.id !== localUserId)
                        const next = [...withoutLocal]
                        if (!next.some(m => m.id === savedUser.id || (m.role === 'user' && m.content === messageText && next[next.length - 1]?.content === messageText))) {
                            next.push({
                                id: savedUser.id,
                                role: 'user',
                                content: messageText,
                                parts: userParts,
                                createdAt: savedUser.createdAt,
                            })
                        } else {
                            const idx = next.findIndex(m => m.id === localUserId || (m.role === 'user' && m.content === messageText))
                            if (idx >= 0) {
                                next[idx] = {
                                    id: savedUser.id,
                                    role: 'user',
                                    content: messageText,
                                    parts: userParts,
                                    createdAt: savedUser.createdAt,
                                }
                            }
                        }
                        if (!(
                            next[next.length - 1]?.role === 'assistant' &&
                            next[next.length - 1]?.content === AGENT_ERROR_TEXT
                        )) {
                            next.push({
                                id: savedError.id,
                                role: 'assistant',
                                content: AGENT_ERROR_TEXT,
                                parts: errorParts,
                                createdAt: savedError.createdAt,
                            })
                        }
                        return next
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
        }
    }

    const mappedDisplayMessages = displayMessages.map(m => ({
        id: m.id,
        role: m.role,
        parts: m.parts ?? [{ type: 'text', text: m.content }],
        createdAt: m.createdAt
    }))

    const streamMessages = isStreaming
        ? (agent.data?.messages?.slice(streamStartIndex) || []).filter((m: any) => m.role !== 'user')
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
