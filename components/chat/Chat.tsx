'use client'

import { useState } from 'react'
import { useEveAgent } from 'eve/react'
import ChatInput from './ChatInput'
import ChatMessagesList from './ChatMessagesList'

export default function Chat() {
    const agent = useEveAgent()
    const [input, setInput] = useState('')

    const isBusy = agent.status === 'submitted' || agent.status === 'streaming'

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!input.trim() || isBusy) return
        await agent.send({ message: input.trim() })
        setInput('')
    }

    return (
        <div className="flex flex-col h-full bg-[#131314] overflow-hidden">
            <ChatMessagesList messages={(agent.data?.messages as any) || []} />
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
