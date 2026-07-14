import { useState } from 'react'
import { TbBrain } from 'react-icons/tb'
import ReactMarkdown from 'react-markdown'

interface Message {
    id: string
    role: 'user' | 'assistant'
    parts?: readonly any[]
}

interface ChatMessagesListProps {
    messages: readonly Message[]
}

function MessageItem({ message }: { message: Message }) {
    const [showReasoning, setShowReasoning] = useState(false)
    const [time] = useState(() => {
        const d = (message as any).createdAt || (message as any).timestamp
        if (d) return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    const hasReasoning = message.parts?.some(part => part.type === 'reasoning')

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
            if (part.type === 'dynamic-tool') {
                return <div key={i} className="text-zinc-500 italic mt-2 text-sm border-l-2 border-zinc-700 pl-3">[Using tool: {part.toolName}]</div>
            }
            if (part.type === 'reasoning') {
                if (!showReasoning) return null
                return (
                    <div key={i} className="bg-[#1a1a1c] border border-zinc-800 rounded-lg p-3 text-zinc-400 italic mb-3 text-sm">
                        {part.text}
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
                    <button
                        onClick={() => setShowReasoning(!showReasoning)}
                        className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-2 ${showReasoning ? 'bg-zinc-800 text-white' : 'hover:bg-[#1e1e20] hover:text-zinc-200'}`}
                        title="Toggle reasoning"
                    >
                        <TbBrain size={16} />
                    </button>
                )}
            </div>
        </div>
    )
}

export default function ChatMessagesList({ messages }: ChatMessagesListProps) {
    if (!messages || messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <span className="text-xl">What can I help with?</span>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:px-8 space-y-8 scroll-smooth">
            <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-4 pt-8">
                {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                ))}
            </div>
        </div>
    )
}

