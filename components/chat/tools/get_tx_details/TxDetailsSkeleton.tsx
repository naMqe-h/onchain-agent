export default function TxDetailsSkeleton() {
    return (
        <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl my-3 animate-pulse">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex flex-col gap-2">
                    <div className="w-32 h-3.5 bg-zinc-800/60 rounded" />
                    <div className="w-48 h-3 bg-zinc-800/40 rounded font-mono" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-16 h-5 bg-zinc-800/80 rounded-full" />
                    <div className="w-16 h-5 bg-zinc-800/80 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex flex-col gap-2">
                        <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                        <div className="w-24 h-4 bg-zinc-800/80 rounded" />
                    </div>
                ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                        <div className="w-16 h-3.5 bg-zinc-800/60 rounded" />
                        <div className="w-36 h-3.5 bg-zinc-800/80 rounded font-mono" />
                    </div>
                ))}
            </div>
        </div>
    )
}
