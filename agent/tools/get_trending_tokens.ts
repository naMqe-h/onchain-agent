import { defineTool } from "eve/tools"
import { z } from "zod"
import { normalizeNetworkId } from "../../lib/web3/config"

const GECKOTERMINAL_CHAIN_MAP: Record<string, string> = {
    "ethereum": "eth",
    "eth": "eth",
    "ethereum-sepolia": "sepolia-testnet",
    "sepolia": "sepolia-testnet",
    "polygon": "polygon_pos",
    "polygon_pos": "polygon_pos",
    "matic": "polygon_pos",
    "robinhood": "robinhood",
    "robinhood-testnet": "robinhood-testnet",
    "solana": "solana",
    "sol": "solana",
    "base": "base",
    "bsc": "bsc",
    "binance": "bsc",
    "bnb": "bsc",
    "arbitrum": "arbitrum",
    "arb": "arbitrum",
    "optimism": "optimism",
    "op": "optimism",
    "avax": "avax",
    "avalanche": "avax",
    "sui": "sui-network",
    "blast": "blast",
    "ton": "ton",
}

const GECKOTERMINAL_PRETTY_NAME_MAP: Record<string, string> = {
    "eth": "Ethereum",
    "polygon_pos": "Polygon",
    "robinhood": "Robinhood",
    "solana": "Solana",
    "base": "Base",
    "bsc": "BNB Chain",
    "arbitrum": "Arbitrum",
    "optimism": "Optimism",
    "avax": "Avalanche",
    "sui-network": "Sui",
    "blast": "Blast",
    "ton": "TON",
}

export default defineTool({
    description:
        "Get top trending tokens (memecoins) on a specified blockchain network. " +
        "If chain is not specified, it defaults to the user's active network from the settings.",
    inputSchema: z.object({
        chain: z.string().optional().describe("Optional network name (e.g. 'ethereum', 'polygon'). Defaults to active network."),
    }),
    async execute({ chain }, ctx) {
        let geckoChainId = ""

        if (chain && chain.trim()) {
            const normalizedInput = chain.trim().toLowerCase()
            geckoChainId = GECKOTERMINAL_CHAIN_MAP[normalizedInput] || normalizedInput
        } else {
            const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
            const activeNetwork = normalizeNetworkId(
                typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
            )
            geckoChainId = GECKOTERMINAL_CHAIN_MAP[activeNetwork] || "eth"
        }

        const lowerChain = geckoChainId.toLowerCase()
        if (lowerChain.includes("testnet") || lowerChain.includes("sepolia")) {
            return {
                success: false,
                error: "Trending tokens are not supported on testnets. Please switch to a mainnet network"
            }
        }

        try {
            const url = `https://api.geckoterminal.com/api/v2/networks/${geckoChainId}/trending_pools?include=base_token,quote_token,dex`
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json;version=20230203"
                }
            })

            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to fetch trending pools (Status: ${response.status} ${response.statusText})`,
                }
            }

            const data = await response.json()
            const pools = Array.isArray(data?.data) ? data.data : []
            const included = Array.isArray(data?.included) ? data.included : []

            const tokensMap = new Map<string, any>()
            for (const item of included) {
                if (item.type === "token" && item.id && item.attributes) {
                    tokensMap.set(item.id, item.attributes)
                }
            }

            const dexMap = new Map<string, any>()
            for (const item of included) {
                if (item.type === "dex" && item.id && item.attributes) {
                    dexMap.set(item.id, item.attributes)
                }
            }

            const mappedTokens = pools.map((pool: any) => {
                const baseTokenId = pool.relationships?.base_token?.data?.id
                const baseTokenAttr = baseTokenId ? tokensMap.get(baseTokenId) : null

                const dexId = pool.relationships?.dex?.data?.id
                const dexAttr = dexId ? dexMap.get(dexId) : null

                const attributes = pool.attributes || {}

                const poolName = attributes.name || ""
                const nameParts = poolName.split("/")
                const fallbackSymbol = nameParts[0]?.trim() || "UNKNOWN"

                const priceUsd = attributes.base_token_price_usd ? parseFloat(attributes.base_token_price_usd) : null
                const fdvUsd = attributes.fdv_usd ? parseFloat(attributes.fdv_usd) : null
                const marketCapUsd = attributes.market_cap_usd ? parseFloat(attributes.market_cap_usd) : null
                const volume24hUsd = attributes.volume_usd?.h24 ? parseFloat(attributes.volume_usd.h24) : 0
                const reserveUsd = attributes.reserve_in_usd ? parseFloat(attributes.reserve_in_usd) : null
                const priceChangePercentage24h = attributes.price_change_percentage?.h24 ? parseFloat(attributes.price_change_percentage.h24) : null
                const priceChangePercentage1h = attributes.price_change_percentage?.h1 ? parseFloat(attributes.price_change_percentage.h1) : null
                const transactions24h = attributes.transactions?.h24 || { buys: 0, sells: 0, buyers: 0, sellers: 0 }

                return {
                    poolAddress: attributes.address,
                    poolName,
                    tokenAddress: baseTokenAttr?.address || baseTokenId?.split("_")?.[1] || "",
                    name: baseTokenAttr?.name || fallbackSymbol,
                    symbol: baseTokenAttr?.symbol || fallbackSymbol,
                    imageUrl: baseTokenAttr?.image_url || null,
                    priceUsd,
                    fdvUsd,
                    marketCapUsd,
                    volume24hUsd,
                    reserveUsd,
                    priceChangePercentage24h,
                    priceChangePercentage1h,
                    dexName: dexAttr?.name || dexId || "DEX",
                    transactions24h: {
                        buys: Number(transactions24h.buys || 0),
                        sells: Number(transactions24h.sells || 0),
                        buyers: Number(transactions24h.buyers || 0),
                        sellers: Number(transactions24h.sellers || 0),
                    },
                }
            })

            const top10Tokens = mappedTokens.slice(0, 10).map((t: any, index: number) => ({
                ...t,
                rank: index + 1,
            }))

            const prettyChainName = GECKOTERMINAL_PRETTY_NAME_MAP[geckoChainId] || (geckoChainId.charAt(0).toUpperCase() + geckoChainId.slice(1))

            if (top10Tokens.length === 0) {
                return {
                    success: true,
                    found: false,
                    chain: prettyChainName,
                    message: `No trending pools found for network '${geckoChainId}'.`,
                }
            }

            return {
                success: true,
                found: true,
                chain: prettyChainName,
                tokens: top10Tokens,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to search for trending tokens",
            }
        }
    },
})
