import { useState } from 'react'
import { FiCopy, FiCheck } from 'react-icons/fi'
import { formatUsdCompact, formatPercent } from '../../../../lib/format'
import { TrendingToken } from '@/types'
import AddToCoinBookButton from '../AddToCoinBookButton'

interface TrendingTokensCardProps {
    data: {
        success: boolean
        found: boolean
        chain: string
        tokens: TrendingToken[]
    }
    activeNetwork?: string
}

export default function TrendingTokensCard({ data, activeNetwork }: TrendingTokensCardProps) {
    const { chain, tokens } = data
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const targetChain = chain || activeNetwork || 'ethereum'

    const handleCopyAddress = async (address: string, index: number) => {
        try {
            await navigator.clipboard.writeText(address)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'bg-amber-500/25 border-amber-500/50 text-amber-300'
        if (rank === 2) return 'bg-slate-400/25 border-slate-400/50 text-slate-300'
        if (rank === 3) return 'bg-amber-700/25 border-amber-800/50 text-amber-600'
        return 'bg-zinc-800 border-zinc-700/50 text-zinc-400'
    }

    return (
        <div className="w-full bg-[#171719]/90 border border-zinc-800/85 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60 mb-4">
                <div>
                    <h3 className="font-semibold text-zinc-100 text-lg">Trending Tokens</h3>
                </div>
                <div className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                    {chain}
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-150">
                    <thead>
                        <tr className="border-b border-zinc-800/40 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                            <th className="pb-3 pl-2">Token</th>
                            <th className="pb-3 text-right">24h %</th>
                            <th className="pb-3 text-right">24h Volume</th>
                            <th className="pb-3 text-right">24h Tx / Users</th>
                            <th className="pb-3 text-right">Market Cap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30 text-sm">
                        {tokens.map((token, i) => {
                            const isPositive24h = token.priceChangePercentage24h != null && token.priceChangePercentage24h >= 0
                            const tokenAddr = token.tokenAddress || token.address

                            return (
                                <tr key={token.poolAddress} className="hover:bg-zinc-800/20 transition-colors group">
                                    <td className="py-3.5 pl-2">
                                        <div className="flex items-center gap-3">
                                            {token.imageUrl ? (
                                                <img
                                                    src={token.imageUrl}
                                                    alt={`${token.name || 'token'} logo`}
                                                    className="w-8 h-8 rounded-full object-cover border border-zinc-850"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-zinc-850 flex items-center justify-center font-bold text-xs text-purple-400 border border-zinc-805">
                                                    {(token.symbol || 'TK').slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">
                                                        {token.symbol || '-'}
                                                    </span>
                                                    <div className="inline-flex items-center gap-1">
                                                        {tokenAddr && (
                                                            <button
                                                                onClick={() => handleCopyAddress(tokenAddr, i)}
                                                                className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 rounded transition-colors cursor-pointer"
                                                                title="Copy contract address"
                                                            >
                                                                {copiedIndex === i ? <FiCheck className="text-emerald-400" size={11} /> : <FiCopy size={11} />}
                                                            </button>
                                                        )}
                                                        <AddToCoinBookButton
                                                            address={tokenAddr || token.symbol || token.name}
                                                            chain={targetChain}
                                                            symbol={token.symbol}
                                                            size={11}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-xs text-zinc-500 max-w-37.5 truncate">{token.name || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`py-3.5 text-right font-semibold ${isPositive24h ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatPercent(token.priceChangePercentage24h)}
                                    </td>
                                    <td className="py-3.5 text-right text-zinc-300 font-mono text-xs">
                                        {formatUsdCompact(typeof token.volume24hUsd === 'string' ? parseFloat(token.volume24hUsd) : token.volume24hUsd)}
                                    </td>
                                    <td className="py-3.5 text-right text-xs">
                                        <div className="flex flex-col items-end">
                                            <div className="font-mono text-zinc-300">
                                                {token.transactions24h?.buys !== undefined ? `${token.transactions24h.buys}` : '-'}/{token.transactions24h?.sells !== undefined ? `${token.transactions24h.sells}` : '-'}
                                            </div>
                                            <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                                                {token.transactions24h?.buyers !== undefined ? `${token.transactions24h.buyers}` : '-'}/{token.transactions24h?.sellers !== undefined ? `${token.transactions24h.sellers}` : '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 text-right text-zinc-300 font-mono text-xs">
                                        {formatUsdCompact(token.marketCapUsd || token.fdvUsd)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
