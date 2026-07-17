import { defineChain, type Chain } from "viem"
import { mainnet, polygon } from "viem/chains"

export type NetworkId =
    | "robinhood-testnet"
    | "robinhood-mainnet"
    | "ethereum"
    | "polygon"

export const NETWORK_IDS: NetworkId[] = [
    "robinhood-testnet",
    "robinhood-mainnet",
    "ethereum",
    "polygon",
]

export const DEFAULT_NETWORK_ID: NetworkId = "robinhood-testnet"

const NETWORK_ALIASES: Record<string, NetworkId> = {
    testnet: "robinhood-testnet",
    mainnet: "robinhood-mainnet",
    "robinhood-testnet": "robinhood-testnet",
    "robinhood-mainnet": "robinhood-mainnet",
    ethereum: "ethereum",
    polygon: "polygon",
}

export function isSupportedNetwork(id: string): boolean {
    return id in NETWORK_ALIASES
}

export function normalizeNetworkId(raw?: string | null): NetworkId {
    if (!raw || typeof raw !== "string") return DEFAULT_NETWORK_ID
    const key = raw.trim().toLowerCase()
    return NETWORK_ALIASES[key] ?? DEFAULT_NETWORK_ID
}

export const robinhoodTestnet = defineChain({
    id: 46630,
    name: "Robinhood Chain Testnet",
    network: "robinhood-testnet",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: [
                process.env.ALCHEMY_RPC_URL_ROBINHOOD_TESTNET ||
                process.env.ALCHEMY_RPC_URL_TESTNET ||
                "",
            ],
        },
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://explorer.testnet.chain.robinhood.com",
        },
    },
})

export const robinhoodMainnet = defineChain({
    id: 4663,
    name: "Robinhood Chain",
    network: "robinhood-mainnet",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: [
                process.env.ALCHEMY_RPC_URL_ROBINHOOD_MAINNET ||
                process.env.ALCHEMY_RPC_URL_MAINNET ||
                "",
            ],
        },
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://robinhoodchain.blockscout.com",
        },
    },
})

const ethereumMainnet: Chain = {
    ...mainnet,
    rpcUrls: {
        ...mainnet.rpcUrls,
        default: {
            http: [process.env.ALCHEMY_RPC_URL_ETHEREUM || ""],
        },
    },
}

const polygonMainnet: Chain = {
    ...polygon,
    rpcUrls: {
        ...polygon.rpcUrls,
        default: {
            http: [process.env.ALCHEMY_RPC_URL_POLYGON || ""],
        },
    },
}

type NetworkMeta = {
    id: NetworkId
    label: string
    shortLabel: string
    chain: Chain
    explorerBaseUrl: string
    nativeSymbol: string
    blockscoutUrlEnv: string[]
    dexScreenerChainIds: string[]
}

function getSharedBlockscoutApiKey(): string | undefined {
    const key = process.env.BLOCKSCOUT_API_KEY_MAINNET?.trim()
    return key || undefined
}

function firstEnv(...names: string[]): string {
    for (const name of names) {
        const value = process.env[name]?.trim()
        if (value) return value
    }
    return ""
}

const NETWORK_META: Record<NetworkId, NetworkMeta> = {
    "robinhood-testnet": {
        id: "robinhood-testnet",
        label: "Robinhood Chain Testnet",
        shortLabel: "Robinhood Testnet",
        chain: robinhoodTestnet,
        explorerBaseUrl: "https://explorer.testnet.chain.robinhood.com",
        nativeSymbol: "ETH",
        blockscoutUrlEnv: [
            "BLOCKSCOUT_API_URL_ROBINHOOD_TESTNET"
        ],
        dexScreenerChainIds: ["robinhood", "4663", "46630"],
    },
    "robinhood-mainnet": {
        id: "robinhood-mainnet",
        label: "Robinhood Chain Mainnet",
        shortLabel: "Robinhood Mainnet",
        chain: robinhoodMainnet,
        explorerBaseUrl: "https://robinhoodchain.blockscout.com",
        nativeSymbol: "ETH",
        blockscoutUrlEnv: [
            "BLOCKSCOUT_API_URL_ROBINHOOD_MAINNET",
        ],
        dexScreenerChainIds: ["robinhood", "4663"],
    },
    ethereum: {
        id: "ethereum",
        label: "Ethereum Mainnet",
        shortLabel: "Ethereum",
        chain: ethereumMainnet,
        explorerBaseUrl: "https://etherscan.io",
        nativeSymbol: "ETH",
        blockscoutUrlEnv: ["BLOCKSCOUT_API_URL_ETHEREUM"],
        dexScreenerChainIds: ["ethereum"],
    },
    polygon: {
        id: "polygon",
        label: "Polygon Mainnet",
        shortLabel: "Polygon",
        chain: polygonMainnet,
        explorerBaseUrl: "https://polygonscan.com",
        nativeSymbol: "POL",
        blockscoutUrlEnv: ["BLOCKSCOUT_API_URL_POLYGON"],
        dexScreenerChainIds: ["polygon"],
    },
}

export type NetworkOption = {
    id: NetworkId
    label: string
    shortLabel: string
    chainId: number
    description: string
    accent: "amber" | "indigo" | "blue" | "violet"
}

export const NETWORK_OPTIONS: NetworkOption[] = [
    {
        id: "robinhood-testnet",
        label: "Robinhood Chain Testnet",
        shortLabel: "Robinhood Testnet",
        chainId: 46630,
        description: "Chain ID: 46630. For development and safe testing.",
        accent: "amber",
    },
    {
        id: "robinhood-mainnet",
        label: "Robinhood Chain Mainnet",
        shortLabel: "Robinhood Mainnet",
        chainId: 4663,
        description: "Chain ID: 4663. Real transactions on Robinhood Chain.",
        accent: "indigo",
    },
    {
        id: "ethereum",
        label: "Ethereum Mainnet",
        shortLabel: "Ethereum",
        chainId: 1,
        description: "Chain ID: 1. Real transactions on Ethereum.",
        accent: "blue",
    },
    {
        id: "polygon",
        label: "Polygon Mainnet",
        shortLabel: "Polygon",
        chainId: 137,
        description: "Chain ID: 137. Real transactions on Polygon.",
        accent: "violet",
    },
]

function meta(network?: string | null): NetworkMeta {
    return NETWORK_META[normalizeNetworkId(network)]
}

export function getChainConfig(network?: string | null): Chain {
    return meta(network).chain
}

export function getExplorerBaseUrl(network?: string | null): string {
    return meta(network).explorerBaseUrl
}

export function getNetworkLabel(network?: string | null): string {
    return meta(network).label
}

export function getNetworkShortLabel(network?: string | null): string {
    return meta(network).shortLabel
}

export function getNativeCurrencySymbol(network?: string | null): string {
    return meta(network).nativeSymbol
}

export function getDexScreenerChainIds(network?: string | null): string[] {
    return meta(network).dexScreenerChainIds
}

export function getTokenBalancesApi(network?: string | null): {
    baseUrl: string
    apiKey?: string
    networkId: NetworkId
} {
    const m = meta(network)
    const baseUrl = firstEnv(...m.blockscoutUrlEnv)
    return {
        baseUrl,
        apiKey: getSharedBlockscoutApiKey(),
        networkId: m.id,
    }
}
