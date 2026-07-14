'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEveAgent } from 'eve/react'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import AgentAnalysisPanel, { getStepMetrics, getToolMetrics } from './AgentAnalysisPanel'
import { addMessage, updateChatSession, createChat, updateChatModel } from '../../app/actions/chat/chat'

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
}

export default function Chat({ chatId: initialChatId, initialMessages, initialSession, initialModel }: ChatProps) {
    const [input, setInput] = useState('')
    const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>(initialMessages)
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId)
    const [isCreatingDb, setIsCreatingDb] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamStartIndex, setStreamStartIndex] = useState(0)
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState(initialModel || 'gpt-4.1-nano')

    useEffect(() => {
        if (initialModel) {
            setSelectedModel(initialModel)
        }
    }, [initialModel])

    const handleModelChange = async (model: string) => {
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

    const agent = useEveAgent({
        initialSession,
        onFinish: useCallback(async (snapshot: any) => {
            const chatId = chatIdRef.current
            if (!chatId) return

            const messages = snapshot?.data?.messages
            if (!messages || messages.length < 2) return

            const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
            const lastAssistant = [...messages].reverse().find((m: any) => m.role === 'assistant')

            const userText = lastUser?.parts?.find((p: any) => p.type === 'text')?.text ?? ''
            const assistantText = lastAssistant?.parts?.find((p: any) => p.type === 'text')?.text ?? ''

            let enrichedParts = lastAssistant?.parts
            if (enrichedParts && snapshot.events) {
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

            setDisplayMessages(prev => {
                const newMsgs = [...prev]
                if (lastUser && !prev.find(m => m.id === lastUser.id)) newMsgs.push(lastUser as any)
                if (lastAssistant && !prev.find(m => m.id === lastAssistant.id)) {
                    newMsgs.push({
                        ...lastAssistant,
                        parts: enrichedParts
                    } as any)
                }
                return newMsgs
            })

            setIsStreaming(false)

            if (userText) {
                await addMessage(chatId, 'user', userText, lastUser.parts)
            }
            if (assistantText) {
                await addMessage(chatId, 'assistant', assistantText, enrichedParts)
            }

            const session = snapshot.session
            if (session?.sessionId) {
                await updateChatSession(
                    chatId,
                    session.sessionId,
                    session.continuationToken ?? '',
                    session.streamIndex ?? 0
                )
            }
        }, [])
    })

    const isBusy = agent.status === 'submitted' || agent.status === 'streaming' || isCreatingDb || isStreaming

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!input.trim() || isBusy) return

        setStreamStartIndex(agent.data?.messages?.length || 0)
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
            } finally {
                setIsCreatingDb(false)
            }
        }

        await agent.send({
            message: input.trim(),
            headers: {
                'x-model-name': selectedModel
            }
        })
        setInput('')
    }

    const mappedDisplayMessages = displayMessages.map(m => ({
        id: m.id,
        role: m.role,
        parts: m.parts ?? [{ type: 'text', text: m.content }],
        createdAt: m.createdAt
    }))

    const streamMessages = isStreaming
        ? (agent.data?.messages?.slice(streamStartIndex) || [])
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
        <div className="flex h-full w-full bg-[#131314] overflow-hidden">
            <div className="flex-1 flex flex-col h-full min-w-0">
                <ChatMessagesList
                    chatId={currentChatId}
                    messages={enrichedMessages}
                    activeMessageId={activeMessageId}
                    onToggleReasoning={handleToggleReasoning}
                />
                <div className="w-full">
                    <ChatInput
                        input={input}
                        handleInputChange={(e) => setInput(e.target.value)}
                        handleSubmit={handleSubmit}
                        isBusy={isBusy}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                    />
                </div>
            </div>

            {activeMessage && (
                <AgentAnalysisPanel
                    activeMessage={activeMessage}
                    onClose={handleClosePanel}
                    agentEvents={agent.events}
                />
            )}
        </div>
    )
}
