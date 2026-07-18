export default function SwapSkeleton() {
    return (
        <div className="w-full max-w-2xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl my-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="w-16 h-3 bg-zinc-800/60 rounded" />
                        <div className="w-20 h-5 bg-zinc-800 rounded-lg" />
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2.5 pt-4 border-t border-zinc-800/60 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="w-full h-12 bg-zinc-900/60 rounded-xl border border-zinc-800/80"
                    />
                ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 mt-1 animate-pulse">
                <div className="w-16 h-5 bg-zinc-800/80 rounded-full" />
                <div className="w-32 h-4 bg-zinc-800/80 rounded" />
            </div>
        </div>
    )
}
