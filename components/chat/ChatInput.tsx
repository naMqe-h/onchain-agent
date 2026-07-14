import { useState } from 'react'
import { FiArrowUp, FiChevronUp } from 'react-icons/fi'

interface ChatInputProps {
    input: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    isBusy?: boolean
    selectedModel: string
    onModelChange: (model: string) => void
}

export default function ChatInput({
    input,
    handleInputChange,
    handleSubmit,
    isBusy,
    selectedModel,
    onModelChange
}: ChatInputProps) {
    const [isOpen, setIsOpen] = useState(false)

    const models = [
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', shortName: 'GPT-4.1', provider: 'OpenAI' },
        { id: 'cohere/north-mini-code:free', name: 'North Mini Code', shortName: 'North Mini', provider: 'OpenRouter' }
    ]

    const activeModel = models.find(m => m.id === selectedModel) || models[0]

    return (
        <div className="p-4 bg-transparent pb-8">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto bg-[#1e1e20] rounded-full px-4 py-3 items-center shadow-lg border border-white/5 relative z-10">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isBusy}
                    placeholder="Ask Agent"
                    className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-50 text-[15px] ml-2"
                />

                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <span>{activeModel.shortName}</span>
                        <FiChevronUp className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                            <div className="absolute bottom-full mb-2 right-0 w-64 bg-[#1f1f22] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 flex flex-col">
                                <div className="px-3.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1">
                                    Select Model
                                </div>
                                {models.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            onModelChange(m.id)
                                            setIsOpen(false)
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer ${selectedModel === m.id
                                                ? 'bg-white/5 text-zinc-100'
                                                : 'text-zinc-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`font-medium ${selectedModel === m.id ? 'text-zinc-100' : 'text-zinc-200 hover:text-white'}`}>{m.name}</span>
                                        <span className="text-[10px] text-zinc-500">{m.provider}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isBusy || !input.trim()}
                    className="bg-zinc-200 hover:bg-white text-black rounded-full p-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    <FiArrowUp size={20} />
                </button>
            </form>
        </div>
    )
}
