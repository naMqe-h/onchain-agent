export default function CryptoPriceSkeleton() {
    return (
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-xl backdrop-blur-md animate-pulse">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-800" />
                    <div className="flex flex-col gap-2">
                        <div className="w-24 h-4 bg-neutral-800 rounded" />
                        <div className="w-16 h-3 bg-neutral-800/60 rounded" />
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="w-20 h-6 bg-neutral-800 rounded" />
                    <div className="w-12 h-4 bg-neutral-800/60 rounded" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <div className="bg-white/5 p-2.5 rounded-xl flex flex-col gap-2">
                    <div className="w-20 h-3 bg-neutral-800 rounded" />
                    <div className="w-28 h-4 bg-neutral-800 rounded" />
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl flex flex-col gap-2">
                    <div className="w-16 h-3 bg-neutral-800 rounded" />
                    <div className="w-20 h-4 bg-neutral-800 rounded" />
                </div>

                <div className="col-span-2 bg-white/5 p-2.5 rounded-xl flex flex-col gap-2">
                    <div className="w-24 h-3 bg-neutral-800 rounded" />
                </div>
            </div>
        </div>
    )
}
