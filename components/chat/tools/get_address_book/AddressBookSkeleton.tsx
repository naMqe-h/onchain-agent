export default function AddressBookSkeleton() {
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
            </div>

            <div className="my-3 space-y-2">
                {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 shrink-0" />
                            <div className="flex flex-col gap-1.5">
                                <div className="w-20 h-3.5 bg-zinc-800 rounded" />
                                <div className="w-28 h-3 bg-zinc-800/60 rounded" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="h-7 w-7 rounded-lg bg-zinc-800" />
                            <div className="h-7 w-7 rounded-lg bg-zinc-800" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
