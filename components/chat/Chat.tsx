'use client'

import { useState, useCallback } from 'react'
import { useEveAgent } from 'eve/react'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'
import { addMessage, updateChatSession } from '../../app/actions/chat/chat'

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
    chatId: string
    initialMessages: StoredMessage[]
    initialSession: SessionState
}

export default function Chat({ chatId, initialMessages, initialSession }: ChatProps) {
    const [input, setInput] = useState('')
    const [displayMessages, setDisplayMessages] = useState<StoredMessage[]>(initialMessages)

    const agent = useEveAgent({
        initialSession,
        onFinish: useCallback(async (snapshot: any) => {
            const messages = snapshot?.data?.messages
            if (!messages || messages.length < 2) return

            const lastUser = [...messages].reverse().find((m: any) => m.role === 'user')
            const lastAssistant = [...messages].reverse().find((m: any) => m.role === 'assistant')

            const userText = lastUser?.parts?.find((p: any) => p.type === 'text')?.text ?? ''
            const assistantText = lastAssistant?.parts?.find((p: any) => p.type === 'text')?.text ?? ''

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
        }, [chatId])
    })

    const isBusy = agent.status === 'submitted' || agent.status === 'streaming'

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!input.trim() || isBusy) return
        await agent.send({ message: input.trim() })
        setInput('')
    }

    const messages = agent.data?.messages?.length > 0
        ? (agent.data.messages as any)
        : displayMessages.map(m => ({
            id: m.id,
            role: m.role,
            parts: m.parts ?? [{ type: 'text', text: m.content }]
        }))

    return (
        <div className="flex flex-col h-full bg-[#131314] overflow-hidden">
            <ChatMessagesList messages={messages} />
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
