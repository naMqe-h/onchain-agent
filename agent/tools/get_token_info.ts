import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"
import {
    getDexScreenerChainIds,
    getExplorerBaseUrl,
    getNetworkLabel,
    normalizeNetworkId,
} from "../../lib/web3/config"

export default defineTool({
    description:
        "Search and retrieve ERC-20 token / memecoin metadata, price, 24h volume, and market cap on the active network using DEX Screener. " +
        "Use this tool whenever the user asks to check, inspect, lookup, or get information for any token or ticker (e.g. 'check PEPE', 'info USDC', 'what is PEPE'). " +
        "Checks the user's private Coin Book database first.",
    inputSchema: z.object({
        query: z.string().describe("The token name, ticker (symbol), or contract address to search for."),
    }),
    async execute({ query }, ctx) {
        const trimmedQuery = query.trim()
        if (!trimmedQuery) {
            return {
                success: false,
                error: "Query string cannot be empty.",
            }
        }

        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )
        const networkLabel = getNetworkLabel(activeNetwork)
        const allowedChainIds = new Set(
            getDexScreenerChainIds(activeNetwork).map((id) => id.toLowerCase())
        )
        const explorerBaseUrl = getExplorerBaseUrl(activeNetwork)

        try {
            let targetAddress: string | null = null
            if (userId && userId !== "local-dev") {
                const savedCoin = await db.coinBookEntry.findFirst({
                    where: {
                        userId,
                        OR: [
                            { symbol: { equals: trimmedQuery, mode: "insensitive" } },
                            { name: { equals: trimmedQuery, mode: "insensitive" } },
                            { address: { equals: trimmedQuery, mode: "insensitive" } },
                        ],
                    },
                })
                if (savedCoin) {
                    targetAddress = savedCoin.address
                }
            }

            const url = targetAddress
                ? `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(targetAddress)}`
                : `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(trimmedQuery)}`
            const response = await fetch(url)

            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to fetch from DEX Screener API (Status: ${response.status} ${response.statusText})`,
                }
            }

            const data = await response.json()
            const pairs = Array.isArray(data?.pairs) ? data.pairs : []

            const networkPairs = pairs.filter((pair: any) => {
                const chainId = String(pair?.chainId || "").toLowerCase()
                return allowedChainIds.has(chainId)
            })

            if (networkPairs.length === 0) {
                return {
                    success: true,
                    found: false,
                    network: activeNetwork,
                    message: `No trading pairs found for "${trimmedQuery}" on ${networkLabel} on DEX Screener.`,
                }
            }

            const tokensMap = new Map<string, any>()

            for (const pair of networkPairs) {
                const baseToken = pair?.baseToken
                if (!baseToken || !baseToken.address) continue

                const address = baseToken.address
                if (!tokensMap.has(address)) {
                    tokensMap.set(address, {
                        address,
                        symbol: baseToken.symbol || "UNKNOWN",
                        name: baseToken.name || "Unknown Token",
                        imageUrl: undefined,
                        websites: [],
                        socials: [],
                        pairs: [],
                    })
                }

                const tokenData = tokensMap.get(address)
                tokenData.pairs.push(pair)

                const imageUrl = pair?.info?.imageUrl
                if (imageUrl && !tokenData.imageUrl) {
                    tokenData.imageUrl = imageUrl
                }
                const websites = pair?.info?.websites
                if (Array.isArray(websites) && websites.length > 0 && tokenData.websites.length === 0) {
                    tokenData.websites = websites
                }
                const socials = pair?.info?.socials
                if (Array.isArray(socials) && socials.length > 0 && tokenData.socials.length === 0) {
                    tokenData.socials = socials
                }
            }

            const tokens = Array.from(tokensMap.values()).map((tokenData) => {
                let bestPair = tokenData.pairs[0]
                let highestVolume = 0

                for (const pair of tokenData.pairs) {
                    const volume24h = parseFloat(pair?.volume?.h24 || 0)
                    if (volume24h > highestVolume) {
                        highestVolume = volume24h
                        bestPair = pair
                    }
                }

                let totalVolume24h = 0
                for (const pair of tokenData.pairs) {
                    totalVolume24h += parseFloat(pair?.volume?.h24 || 0)
                }

                return {
                    name: tokenData.name,
                    symbol: tokenData.symbol,
                    address: tokenData.address,
                    imageUrl: tokenData.imageUrl,
                    priceUsd: bestPair?.priceUsd,
                    priceNative: bestPair?.priceNative,
                    volume24h: totalVolume24h,
                    fdv: bestPair?.fdv,
                    marketCap: bestPair?.marketCap,
                    network: activeNetwork,
                    explorerBaseUrl,
                    bestPair: {
                        dexId: bestPair?.dexId,
                        pairAddress: bestPair?.pairAddress,
                        quoteTokenSymbol: bestPair?.quoteToken?.symbol,
                        liquidityUsd: bestPair?.liquidity?.usd,
                        url: bestPair?.url,
                    },
                    websites: tokenData.websites,
                    socials: tokenData.socials,
                }
            })

            tokens.sort((a, b) => {
                const volA = a.volume24h || 0
                const volB = b.volume24h || 0
                return volB - volA
            })

            return {
                success: true,
                found: true,
                network: activeNetwork,
                token: tokens[0],
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to search for token on DEX Screener",
            }
        }
    },
})
