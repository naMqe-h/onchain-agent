import { useState } from 'react'
import { FiCopy, FiCheck, FiExternalLink, FiGlobe } from 'react-icons/fi'
import { FaTelegram } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { type TokenInfo } from '@/types'
import AddToCoinBookButton from '../AddToCoinBookButton'

interface TokenInfoCardProps {
    token: TokenInfo
    activeNetwork?: string
}

export default function TokenInfoCard({ token, activeNetwork }: TokenInfoCardProps) {
    const [copied, setCopied] = useState(false)
    const targetChain = token.network || activeNetwork || 'ethereum'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(token.address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    const formatPrice = (priceStr?: string) => {
        if (!priceStr) return '$0.00'
        const price = parseFloat(priceStr)
        if (isNaN(price)) return `$${priceStr}`
        if (price === 0) return '$0.00'
        if (price < 0.0001) {
            return `$${price.toFixed(8)}`
        }
        if (price < 0.01) {
            return `$${price.toFixed(6)}`
        }
        if (price < 1) {
            return `$${price.toFixed(4)}`
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price)
    }

    const formatNumber = (num?: number, isCurrency = false) => {
        if (num === undefined || num === null) return 'N/A'
        const prefix = isCurrency ? '$' : ''
        if (num >= 1_000_000_000) {
            return `${prefix}${(num / 1_000_000_000).toFixed(2)}B`
        }
        if (num >= 1_000_000) {
            return `${prefix}${(num / 1_000_000).toFixed(2)}M`
        }
        if (num >= 1_000) {
            return `${prefix}${(num / 1_000).toFixed(2)}K`
        }
        return `${prefix}${num.toFixed(2)}`
    }

    const shortAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const twitterLink = token.socials?.find(s => s.type?.toLowerCase() === 'twitter')?.url
    const telegramLink = token.socials?.find(s => s.type?.toLowerCase() === 'telegram')?.url
    const websiteLink = token.websites?.[0]?.url

    return (
        <div className="w-full max-w-2xl bg-[#171719]/90 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-zinc-700/60 my-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                    {token.imageUrl ? (
                        <img
                            src={token.imageUrl}
                            alt={`${token.name} logo`}
                            className="w-12 h-12 rounded-full object-cover border border-zinc-700/50 shadow-inner"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center font-bold text-lg text-purple-400">
                            {token.symbol ? token.symbol.slice(0, 2).toUpperCase() : 'T'}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-zinc-100 text-lg">{token.name}</h3>
                            <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700/30">
                                {token.symbol}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {token.bestPair?.dexId ? `DEX: ${token.bestPair.dexId.toUpperCase()}` : 'DEX Screener'}
                            {token.bestPair?.quoteTokenSymbol && ` • Pair with ${token.bestPair.quoteTokenSymbol}`}
                        </p>
                    </div>
                </div>

                {token.bestPair?.url && (
                    <a
                        href={token.bestPair.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition-colors"
                    >
                        <span>View on DEX Screener</span>
                        <FiExternalLink size={14} />
                    </a>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Price USD</span>
                    <span className="text-base font-bold text-zinc-100">{formatPrice(token.priceUsd)}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Liquidity USD</span>
                    <span className="text-base font-bold text-zinc-100">
                        {formatNumber(token.bestPair?.liquidityUsd, true)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">24h Volume</span>
                    <span className="text-base font-bold text-zinc-100">{formatNumber(token.volume24h, true)}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">Market Cap / FDV</span>
                    <span className="text-base font-bold text-zinc-100">
                        {formatNumber(token.marketCap ?? token.fdv, true)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-4 border-t border-zinc-800/60">
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-zinc-900/60 px-3.5 py-2 rounded-xl border border-zinc-800/80 grow max-w-md">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Contract Address</span>
                        <a
                            href={`${token.explorerBaseUrl || 'https://robinhoodchain.blockscout.com'}/token/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-zinc-300 hover:text-purple-400 flex items-center gap-1 transition-colors"
                        >
                            <span>{shortAddress(token.address)}</span>
                            <FiExternalLink size={12} className="opacity-60" />
                        </a>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-700/50"
                            title="Copy contract address"
                        >
                            {copied ? <FiCheck className="text-emerald-400" size={16} /> : <FiCopy size={16} />}
                        </button>
                        <AddToCoinBookButton
                            address={token.address}
                            chain={targetChain}
                            symbol={token.symbol}
                            size={16}
                            className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
                    {websiteLink && (
                        <a
                            href={websiteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-750 text-zinc-300 hover:text-zinc-100 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                            title="Website"
                        >
                            <FiGlobe size={18} />
                        </a>
                    )}
                    {twitterLink && (
                        <a
                            href={twitterLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-750 text-zinc-300 hover:text-zinc-100 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                            title="Twitter"
                        >
                            <FaXTwitter size={18} />
                        </a>
                    )}
                    {telegramLink && (
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800/60 hover:border-zinc-750 text-zinc-300 hover:text-zinc-100 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                            title="Telegram"
                        >
                            <FaTelegram size={18} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
