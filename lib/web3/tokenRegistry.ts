import type { NetworkId } from "./config"
import { NATIVE_TOKEN_ADDRESS } from "./uniswap/client"

export type RegistryToken = {
    address: string
    symbol: string
    name: string
    decimals: number
}

const REGISTRY: Partial<Record<NetworkId, RegistryToken[]>> = {
    ethereum: [
        {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
        },
        {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
        },
        {
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
        },
        {
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            symbol: "DAI",
            name: "Dai Stablecoin",
            decimals: 18,
        },
    ],
    polygon: [
        {
            address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            symbol: "WPOL",
            name: "Wrapped POL",
            decimals: 18,
        },
        {
            address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
        },
        {
            address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
            symbol: "USDC",
            name: "USD Coin",
            decimals: 6,
        },
        {
            address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            symbol: "USDC.e",
            name: "USD Coin (PoS bridged)",
            decimals: 6,
        },
        {
            address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            symbol: "USDT",
            name: "Tether USD (PoS)",
            decimals: 6,
        },
        {
            address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
            symbol: "DAI",
            name: "Dai Stablecoin (PoS)",
            decimals: 18,
        },
    ],
    "ethereum-sepolia": [
        {
            address: "0xfff9976782d46CC05630D1f6eBAb18b2324d6B14",
            symbol: "WETH",
            name: "Wrapped Ether",
            decimals: 18,
        },
        {
            address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
            symbol: "USDC",
            name: "USDC (Sepolia)",
            decimals: 6,
        },
    ],
    "robinhood-mainnet": [],
    "robinhood-testnet": [],
}

export function lookupRegistryToken(
    network: NetworkId,
    query: string
): RegistryToken | null {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const list = REGISTRY[network] ?? []
    const exact = list.filter(
        (t) =>
            t.symbol.toLowerCase() === q ||
            t.name.toLowerCase() === q
    )
    if (exact.length === 1) return exact[0]
    if (exact.length > 1) {
        return exact[0]
    }
    return null
}

export function listRegistryTokens(network: NetworkId): RegistryToken[] {
    return REGISTRY[network] ?? []
}

export { NATIVE_TOKEN_ADDRESS }
