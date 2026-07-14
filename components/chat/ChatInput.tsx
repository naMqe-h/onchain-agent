import { FiArrowUp } from 'react-icons/fi'

interface ChatInputProps {
    input: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    isBusy?: boolean
}

export default function ChatInput({ input, handleInputChange, handleSubmit, isBusy }: ChatInputProps) {
    return (
        <div className="p-4 bg-transparent pb-8">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto bg-[#1e1e20] rounded-full px-4 py-3 items-center shadow-lg border border-white/5">
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isBusy}
                    placeholder="Ask Agent"
                    className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-50 text-[15px] ml-2"
                />

                <button
                    type="submit"
                    disabled={isBusy || !input.trim()}
                    className="bg-zinc-200 hover:bg-white text-black rounded-full p-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiArrowUp size={20} />
                </button>
            </form>
        </div>
    )
}
