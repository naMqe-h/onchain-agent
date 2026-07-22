import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi'
import { type CryptoPriceInfo } from '@/types'
import { formatUsdCompact, formatPercent, usdStandardFormatter } from '../../../../lib/format'

interface CryptoPriceCardProps {
    data: CryptoPriceInfo
}

export default function CryptoPriceCard({ data }: CryptoPriceCardProps) {
    const isPositive = (data.priceChangePercentage24h ?? 0) >= 0

    return (
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt={data.name}
                            className="h-10 w-10 rounded-full bg-neutral-800 p-0.5 object-contain"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                            {data.symbol?.slice(0, 2) || 'CR'}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-lg leading-tight">{data.name}</h3>
                            <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-mono text-neutral-400 uppercase">
                                {data.symbol}
                            </span>
                        </div>
                        {data.marketCapRank && (
                            <span className="text-xs text-neutral-400">
                                Rank #{data.marketCapRank}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-white tracking-tight">
                        {usdStandardFormatter.format(data.currentPrice)}
                    </span>
                    {data.priceChangePercentage24h !== undefined && (
                        <div
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${isPositive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                        >
                            {isPositive ? <FiTrendingUp className="h-3 w-3" /> : <FiTrendingDown className="h-3 w-3" />}
                            <span>{formatPercent(data.priceChangePercentage24h)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
                <div className="flex flex-col gap-1 bg-white/5 p-2.5 rounded-xl">
                    <span className="text-neutral-400 flex items-center gap-1">
                        <FiActivity className="h-3 w-3 text-neutral-400" /> 24h High / Low
                    </span>
                    <span className="font-medium text-neutral-200">
                        {usdStandardFormatter.format(data.high24h ?? 0)} / {usdStandardFormatter.format(data.low24h ?? 0)}
                    </span>
                </div>

                <div className="flex flex-col gap-1 bg-white/5 p-2.5 rounded-xl">
                    <span className="text-neutral-400">Market Cap</span>
                    <span className="font-medium text-neutral-200">
                        {formatUsdCompact(data.marketCap)}
                    </span>
                </div>

                <div className="col-span-2 flex flex-col gap-1 bg-white/5 p-2.5 rounded-xl">
                    <div className="flex justify-between items-center text-neutral-400">
                        <span>24h Volume</span>
                        <span className="text-neutral-200 font-medium">{formatUsdCompact(data.totalVolume)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex justify-between items-center text-[10px] text-neutral-500 pt-1">
                <span>Data provided by CoinGecko API</span>
                {data.lastUpdated && (
                    <span>Updated {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
            </div>
        </div>
    )
}
