export default function TokenInfoSkeleton() {
    return (
        <div className="w-full max-w-2xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl my-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700/30" />
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-5 bg-zinc-800 rounded-lg" />
                            <div className="w-12 h-4 bg-zinc-800 rounded-full" />
                        </div>
                        <div className="w-48 h-3 bg-zinc-800/60 rounded" />
                    </div>
                </div>
                <div className="w-28 h-4 bg-zinc-800/80 rounded" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                        <div className="w-24 h-5 bg-zinc-800 rounded-lg" />
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-zinc-800/60 animate-pulse">
                <div className="w-full max-w-md h-12 bg-zinc-900/60 rounded-xl border border-zinc-850" />
                <div className="flex items-center gap-2 justify-end md:justify-start">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 bg-zinc-850 border border-zinc-800/60 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    )
}
