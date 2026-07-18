export default function ChatSkeleton() {
    return (
        <div
            className="relative flex h-full w-full bg-[#131314] overflow-hidden"
            aria-busy="true"
            aria-label="Loading chat"
        >
            <div className="flex-1 flex flex-col h-full min-w-0">
                <div className="flex-1 overflow-y-auto p-4 md:px-8">
                    <div
                        className="max-w-3xl mx-auto flex flex-col gap-8 pb-4 pt-8 animate-pulse"
                        aria-hidden
                    >
                        <div className="flex flex-col items-end justify-end w-full gap-1">
                            <div className="bg-[#1e1e20] px-5 py-3 rounded-[24px] max-w-[85%] w-[42%]">
                                <div className="h-3.5 bg-zinc-700/50 rounded" />
                            </div>
                            <div className="w-12 h-2.5 bg-zinc-800/40 rounded px-1" />
                        </div>

                        <div className="flex flex-col items-start w-full gap-2">
                            <div className="w-full space-y-2.5">
                                <div className="w-full h-3.5 bg-zinc-800/70 rounded" />
                                <div className="w-[92%] h-3.5 bg-zinc-800/60 rounded" />
                                <div className="w-[74%] h-3.5 bg-zinc-800/50 rounded" />
                            </div>
                            <div className="w-14 h-2.5 bg-zinc-800/40 rounded mt-0.5" />
                        </div>

                        <div className="flex flex-col items-end justify-end w-full gap-1">
                            <div className="bg-[#1e1e20] px-5 py-3 rounded-[24px] max-w-[85%] w-[58%] space-y-2">
                                <div className="h-3.5 bg-zinc-700/50 rounded" />
                                <div className="w-[70%] h-3.5 bg-zinc-700/40 rounded" />
                            </div>
                            <div className="w-12 h-2.5 bg-zinc-800/40 rounded px-1" />
                        </div>

                        <div className="flex flex-col items-start w-full gap-2">
                            <div className="w-full space-y-2.5">
                                <div className="w-[96%] h-3.5 bg-zinc-800/70 rounded" />
                                <div className="w-full h-3.5 bg-zinc-800/60 rounded" />
                                <div className="w-[88%] h-3.5 bg-zinc-800/55 rounded" />
                                <div className="w-[58%] h-3.5 bg-zinc-800/45 rounded" />
                            </div>
                            <div className="w-14 h-2.5 bg-zinc-800/40 rounded mt-0.5" />
                        </div>

                        <div className="flex flex-col items-end justify-end w-full gap-1">
                            <div className="bg-[#1e1e20] px-5 py-3 rounded-[24px] max-w-[85%] w-[28%]">
                                <div className="h-3.5 bg-zinc-700/50 rounded" />
                            </div>
                            <div className="w-12 h-2.5 bg-zinc-800/40 rounded px-1" />
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="px-4 pt-3 pb-3 bg-transparent">
                        <div className="max-w-3xl mx-auto flex flex-col gap-1.5" aria-hidden>
                            <div className="flex gap-3 bg-[#1e1e20] rounded-full px-4 py-3 items-center shadow-lg border border-white/5 animate-pulse">
                                <div className="flex-1 h-4 ml-2 bg-zinc-800/50 rounded" />
                                <div className="w-9 h-9 rounded-full bg-zinc-700/40 shrink-0" />
                            </div>
                            <div className="flex items-center justify-between gap-2 px-1 animate-pulse">
                                <div className="w-28 h-3 bg-zinc-800/40 rounded" />
                                <div className="w-20 h-3 bg-zinc-800/40 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
