export default function SwapQuoteSkeleton() {
    return (
        <div className="w-full max-w-md bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl animate-pulse my-2">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-zinc-800" />
                    <div className="flex flex-col gap-1">
                        <div className="w-24 h-3.5 bg-zinc-800 rounded" />
                        <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                    </div>
                </div>
                <div className="w-20 h-5 bg-zinc-800 rounded-full" />
            </div>

            <div className="my-4 p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-xl flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="w-12 h-3 bg-zinc-800/60 rounded" />
                    <div className="w-24 h-6 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 w-8 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex flex-col items-end gap-1.5 min-w-0 flex-1">
                    <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                    <div className="w-24 h-6 bg-zinc-800 rounded" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex flex-col gap-1.5">
                    <div className="w-20 h-3 bg-zinc-800/60 rounded" />
                    <div className="w-14 h-4 bg-zinc-800 rounded" />
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex flex-col gap-1.5">
                    <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                    <div className="w-16 h-4 bg-zinc-800 rounded" />
                </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="w-28 h-6 bg-zinc-800 rounded-lg" />
                <div className="w-16 h-4 bg-zinc-800/60 rounded" />
            </div>
        </div>
    )
}
