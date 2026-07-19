export default function TxHistorySkeleton() {
    return (
        <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl my-3">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60 animate-pulse">
                <div className="flex flex-col gap-2">
                    <div className="w-28 h-3.5 bg-zinc-800/60 rounded" />
                    <div className="w-24 h-3 bg-zinc-800/40 rounded" />
                </div>
                <div className="w-16 h-5 bg-zinc-800/80 rounded-full" />
            </div>

            <div className="mt-3 space-y-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800/80 shrink-0" />
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="w-20 h-4 bg-zinc-800 rounded" />
                                <div className="w-32 h-3 bg-zinc-800/50 rounded" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="w-16 h-4 bg-zinc-800/70 rounded" />
                            <div className="w-20 h-3 bg-zinc-800/40 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
