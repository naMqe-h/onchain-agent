'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEveAgent } from 'eve/react'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import { addMessage, updateChatSession, createChat } from '../../app/actions/chat/chat'

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
}

export default function Chat({ chatId: initialChatId, initialMessages, initialSession }: ChatProps) {
    const [input, setInput] = useState('')
    const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>(initialMessages)
    const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatId)
    const [isCreatingDb, setIsCreatingDb] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamStartIndex, setStreamStartIndex] = useState(0)

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

            setDisplayMessages(prev => {
                const newMsgs = [...prev]
                if (lastUser && !prev.find(m => m.id === lastUser.id)) newMsgs.push(lastUser as any)
                if (lastAssistant && !prev.find(m => m.id === lastAssistant.id)) newMsgs.push(lastAssistant as any)
                return newMsgs
            })

            setIsStreaming(false)

            if (userText) {
                await addMessage(chatId, 'user', userText, lastUser.parts)
            }
            if (assistantText) {
                await addMessage(chatId, 'assistant', assistantText, lastAssistant.parts)
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
                const chat = await createChat()
                targetChatId = chat.id
                setCurrentChatId(chat.id)
                chatIdRef.current = chat.id
                window.history.replaceState(null, '', `/chat/${chat.id}`)
            } finally {
                setIsCreatingDb(false)
            }
        }

        await agent.send({ message: input.trim() })
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

    return (
        <div className="flex flex-col h-full bg-[#131314] overflow-hidden">
            <ChatMessagesList chatId={currentChatId} messages={messages} />
            <div className="w-full">
                <ChatInput
                    input={input}
                    handleInputChange={(e) => setInput(e.target.value)}
                    handleSubmit={handleSubmit}
                    isBusy={isBusy}
                />
            </div>
        </div>
    )
}
