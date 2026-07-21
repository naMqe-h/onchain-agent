'use client'

import { FiExternalLink } from 'react-icons/fi'
import {
    EMPTY_VALUE,
    formatBalance,
    formatDisplayText,
    formatShortAddress,
    formatUsd,
    formatUsdCompact,
} from '@/lib/format'
import {
    getExplorerBaseUrl,
    getNetworkShortLabel,
    normalizeNetworkId,
} from '@/lib/web3/config'
import { type TokenBalancesData } from '@/types'

interface TokenBalancesTableProps {
    data: TokenBalancesData
}

export default function TokenBalancesTable({ data }: TokenBalancesTableProps) {
    if (!data.tokens?.length) return null

    const network = normalizeNetworkId(data.network)
    const base = getExplorerBaseUrl(network)
    const networkLabel = getNetworkShortLabel(network)
    const limit = data.returnedCount || data.tokens.length

    return (
        <div className="w-full max-w-3xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">
                        ERC-20 balances
                    </span>
                    {data.address ? (
                        <a
                            href={`${base}/address/${data.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-zinc-400 hover:text-purple-400 flex items-center gap-1 transition-colors w-fit"
                            title={data.address}
                        >
                            <span>{formatShortAddress(data.address)}</span>
                            <FiExternalLink size={11} className="opacity-60 shrink-0" />
                        </a>
                    ) : (
                        <span className="text-xs font-mono text-zinc-500">{EMPTY_VALUE}</span>
                    )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900/80 border border-zinc-800/80 px-2.5 py-1 rounded-full shrink-0">
                    {networkLabel || EMPTY_VALUE}
                </span>
            </div>

            <div className="overflow-x-auto -mx-1 mt-2">
                <table className="w-full min-w-160 text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">
                            <th className="py-2 px-2 font-semibold">Token</th>
                            <th className="py-2 px-2 font-semibold text-right">Balance</th>
                            <th className="py-2 px-2 font-semibold text-right">Value</th>
                            <th className="py-2 px-2 font-semibold text-right">Mkt Cap</th>
                            <th className="py-2 px-2 font-semibold text-right">Vol 24h</th>
                            <th className="py-2 px-2 font-semibold text-right">Contract</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.tokens.map((token, idx) => {
                            const hasIcon = Boolean(token.iconUrl)

                            return (
                                <tr
                                    key={token.address || `token-${idx}`}
                                    className="border-t border-zinc-800/50 text-sm text-zinc-200"
                                >
                                    <td className="py-2.5 px-2 min-w-0">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {hasIcon ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={token.iconUrl as string}
                                                    alt=""
                                                    className="w-7 h-7 rounded-full object-cover border border-zinc-700/50 shrink-0 bg-zinc-900"
                                                    onError={(e) => {
                                                        ; (e.target as HTMLImageElement).style.display = 'none'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-zinc-800/80 border border-zinc-700/40 shrink-0" />
                                            )}
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="font-semibold text-zinc-100 truncate">
                                                    {formatDisplayText(token.symbol)}
                                                </span>
                                                <span
                                                    className="text-[11px] text-zinc-500 truncate max-w-30"
                                                    title={token.name || undefined}
                                                >
                                                    {formatDisplayText(token.name)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td
                                        className="py-2.5 px-2 text-right font-mono text-xs text-zinc-300 whitespace-nowrap"
                                        title={token.balance ?? undefined}
                                    >
                                        {formatBalance(token.balance)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-mono text-xs text-zinc-300 whitespace-nowrap">
                                        {formatUsd(token.valueUsd)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-mono text-xs text-zinc-300 whitespace-nowrap">
                                        {formatUsdCompact(token.circulatingMarketCap)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-mono text-xs text-zinc-300 whitespace-nowrap">
                                        {formatUsdCompact(token.volume24h)}
                                    </td>
                                    <td className="py-2.5 px-2 text-right">
                                        {token.address ? (
                                            <a
                                                href={`${base}/token/${token.address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-purple-400 transition-colors"
                                                title={token.address}
                                            >
                                                <span>{formatShortAddress(token.address)}</span>
                                                <FiExternalLink size={11} className="opacity-60 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-xs font-mono text-zinc-500">{EMPTY_VALUE}</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {data.truncated && (
                <p className="pt-3 mt-1 text-[11px] text-zinc-500 border-t border-zinc-800/60">
                    Showing top {limit} of {data.totalCount} tokens by approximate USD value
                </p>
            )}
        </div>
    )
}
