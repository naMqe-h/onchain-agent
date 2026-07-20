export default function TrendingTokensSkeleton() {
    return (
        <div className="w-full bg-[#171719]/90 border border-zinc-800/85 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl my-3 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4 animate-pulse">
                <div className="flex flex-col gap-2">
                    <div className="w-36 h-5 bg-zinc-800 rounded-lg" />
                    <div className="w-64 h-3 bg-zinc-800/60 rounded" />
                </div>
                <div className="w-20 h-4 bg-zinc-800/80 rounded" />
            </div>

            <div className="overflow-x-auto w-full animate-pulse">
                <div className="min-w-[600px] flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-zinc-800/40 pb-3">
                        <div className="w-32 h-4 bg-zinc-800/40 rounded" />
                        <div className="w-12 h-4 bg-zinc-800/40 rounded" />
                        <div className="w-20 h-4 bg-zinc-800/40 rounded" />
                        <div className="w-28 h-4 bg-zinc-800/40 rounded" />
                        <div className="w-24 h-4 bg-zinc-800/40 rounded" />
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex justify-between items-center py-2">
                            <div className="flex items-center gap-2 w-32">
                                <div className="w-8 h-8 bg-zinc-850 rounded-full" />
                                <div className="flex flex-col gap-1 w-16">
                                    <div className="w-12 h-3.5 bg-zinc-850 rounded" />
                                    <div className="w-8 h-2 bg-zinc-900 rounded" />
                                </div>
                            </div>
                            <div className="w-12 h-4 bg-zinc-850 rounded" />
                            <div className="w-20 h-4 bg-zinc-850 rounded" />
                            <div className="flex flex-col items-end gap-1 w-28">
                                <div className="w-24 h-3 bg-zinc-850 rounded" />
                                <div className="w-20 h-2 bg-zinc-900 rounded" />
                            </div>
                            <div className="w-24 h-4 bg-zinc-850 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
