import { defineTool } from "eve/tools"
import { z } from "zod"

const COMMON_COIN_IDS: Record<string, string> = {
    btc: "bitcoin",
    bitcoin: "bitcoin",
    eth: "ethereum",
    ethereum: "ethereum",
    sol: "solana",
    solana: "solana",
    xrp: "ripple",
    ripple: "ripple",
    doge: "dogecoin",
    dogecoin: "dogecoin",
    ada: "cardano",
    cardano: "cardano",
    avax: "avalanche-2",
    avalanche: "avalanche-2",
    link: "chainlink",
    chainlink: "chainlink",
    dot: "polkadot",
    polkadot: "polkadot",
    matic: "polygon-ecosystem-token",
    pol: "polygon-ecosystem-token",
    polygon: "polygon-ecosystem-token",
    near: "near",
    sui: "sui",
    apt: "aptos",
    aptos: "aptos",
    shib: "shiba-inu",
    pepe: "pepe",
    bnb: "binancecoin",
    usdt: "tether",
    usdc: "usd-coin",
}

export default defineTool({
    description:
        "Get live cryptocurrency price, 24h percentage change, 24h volume, high/low, and market cap. " +
        "Use this tool whenever the user asks for the price, rate, or market stats of any cryptocurrency, coin, or token (e.g. 'price of BTC', 'ETH price', 'how much is SOL', 'course of Ripple').",
    inputSchema: z.object({
        symbolOrName: z.string().describe("The ticker symbol or coin name to lookup price for (e.g. 'BTC', 'ETH', 'solana', 'doge')."),
    }),
    async execute({ symbolOrName }) {
        const query = symbolOrName.trim()
        if (!query) {
            return {
                success: false,
                error: "Symbol or coin name cannot be empty.",
            }
        }

        const normalizedQuery = query.toLowerCase()
        let coinId: string | null = COMMON_COIN_IDS[normalizedQuery] || null

        const apiKey = process.env.COINGECKO_API_KEY
        const headers: Record<string, string> = {
            "Accept": "application/json",
        }
        if (apiKey) {
            headers["x-cg-demo-api-key"] = apiKey
        }

        try {
            if (!coinId) {
                const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
                const searchRes = await fetch(searchUrl, { headers })
                if (!searchRes.ok) {
                    return {
                        success: false,
                        error: `CoinGecko search error (Status: ${searchRes.status} ${searchRes.statusText})`,
                    }
                }
                const searchData = await searchRes.json()
                const coins = Array.isArray(searchData?.coins) ? searchData.coins : []

                if (coins.length === 0) {
                    return {
                        success: true,
                        found: false,
                        message: `No cryptocurrency found matching "${query}" on CoinGecko.`,
                    }
                }

                const exactSymbolMatch = coins.find(
                    (c: any) => String(c.symbol || "").toLowerCase() === normalizedQuery
                )
                coinId = exactSymbolMatch ? exactSymbolMatch.id : coins[0].id
            }

            if (!coinId) {
                return {
                    success: true,
                    found: false,
                    message: `No cryptocurrency found matching "${query}".`,
                }
            }

            const marketUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}`
            const chartUrl = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=7`

            const [marketRes, chartRes] = await Promise.all([
                fetch(marketUrl, { headers }),
                fetch(chartUrl, { headers }).catch(() => null),
            ])

            if (!marketRes.ok) {
                return {
                    success: false,
                    error: `API error (Status: ${marketRes.status} ${marketRes.statusText})`,
                }
            }

            const marketData = await marketRes.json()
            if (!Array.isArray(marketData) || marketData.length === 0) {
                return {
                    success: true,
                    found: false,
                    message: `Market data for "${query}" is currently unavailable.`,
                }
            }

            const coin = marketData[0]

            let chartData: Array<{ time: number; value: number }> | undefined
            if (chartRes && chartRes.ok) {
                try {
                    const chartJson = await chartRes.json()
                    if (Array.isArray(chartJson?.prices)) {
                        const points: Array<{ time: number; value: number }> = []
                        const seenTimes = new Set<number>()

                        for (const item of chartJson.prices) {
                            if (Array.isArray(item) && item.length >= 2) {
                                const timestampMs = item[0]
                                const priceVal = item[1]
                                const timeSec = Math.floor(timestampMs / 1000)

                                if (typeof priceVal === "number" && !seenTimes.has(timeSec)) {
                                    seenTimes.add(timeSec)
                                    points.push({ time: timeSec, value: priceVal })
                                }
                            }
                        }

                        points.sort((a, b) => a.time - b.time)
                        if (points.length > 0) {
                            chartData = points
                        }
                    }
                } catch {
                    // Ignore chart error gracefully
                }
            }

            return {
                success: true,
                found: true,
                priceInfo: {
                    id: coin.id,
                    name: coin.name || query,
                    symbol: String(coin.symbol || query).toUpperCase(),
                    image: coin.image || "",
                    currentPrice: coin.current_price,
                    priceChange24h: coin.price_change_24h,
                    priceChangePercentage24h: coin.price_change_percentage_24h,
                    high24h: coin.high_24h,
                    low24h: coin.low_24h,
                    totalVolume: coin.total_volume,
                    marketCap: coin.market_cap,
                    marketCapRank: coin.market_cap_rank,
                    lastUpdated: coin.last_updated,
                    chartData,
                },
            }
        } catch (err: any) {
            return {
                success: false,
                error: err?.message || "Failed to fetch crypto price",
            }
        }
    },
})
