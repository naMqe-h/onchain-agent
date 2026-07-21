import { defineChain, type Chain } from "viem"
import { mainnet, polygon, sepolia } from "viem/chains"

export type NetworkId =
    | "robinhood-testnet"
    | "robinhood-mainnet"
    | "ethereum"
    | "ethereum-sepolia"
    | "polygon"

export const NETWORK_IDS: NetworkId[] = [
    "robinhood-testnet",
    "robinhood-mainnet",
    "ethereum",
    "ethereum-sepolia",
    "polygon",
]

export const DEFAULT_NETWORK_ID: NetworkId = "ethereum"

const NETWORK_ALIASES: Record<string, NetworkId> = {
    testnet: "robinhood-testnet",
    mainnet: "robinhood-mainnet",
    "robinhood-testnet": "robinhood-testnet",
    "robinhood-mainnet": "robinhood-mainnet",
    ethereum: "ethereum",
    "ethereum-sepolia": "ethereum-sepolia",
    sepolia: "ethereum-sepolia",
    "eth-sepolia": "ethereum-sepolia",
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

const ethereumSepolia: Chain = {
    ...sepolia,
    rpcUrls: {
        ...sepolia.rpcUrls,
        default: {
            http: [process.env.ALCHEMY_RPC_URL_ETHEREUM_SEPOLIA || ""],
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
    uniswapSupported: boolean
    universalRouterVersion: "2.0" | "2.1.1"
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
    ethereum: {
        id: "ethereum",
        label: "Ethereum Mainnet",
        shortLabel: "Ethereum",
        chain: ethereumMainnet,
        explorerBaseUrl: "https://etherscan.io",
        nativeSymbol: "ETH",
        blockscoutUrlEnv: ["BLOCKSCOUT_API_URL_ETHEREUM"],
        dexScreenerChainIds: ["ethereum"],
        uniswapSupported: true,
        universalRouterVersion: "2.0",
    },
    "ethereum-sepolia": {
        id: "ethereum-sepolia",
        label: "Ethereum Sepolia",
        shortLabel: "Sepolia",
        chain: ethereumSepolia,
        explorerBaseUrl: "https://sepolia.etherscan.io",
        nativeSymbol: "ETH",
        blockscoutUrlEnv: ["BLOCKSCOUT_API_URL_ETHEREUM_SEPOLIA"],
        dexScreenerChainIds: ["sepolia", "ethereumsepolia"],
        uniswapSupported: true,
        universalRouterVersion: "2.0",
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
        uniswapSupported: true,
        universalRouterVersion: "2.0",
    },
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
        uniswapSupported: false,
        universalRouterVersion: "2.0",
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
        uniswapSupported: true,
        universalRouterVersion: "2.1.1",
    },
}

export type NetworkEnvironment = "mainnet" | "testnet"

export type NetworkOption = {
    id: NetworkId
    label: string
    shortLabel: string
    chainId: number
    environment: NetworkEnvironment
    accent: "amber" | "indigo" | "blue" | "sky" | "violet"
}

export const NETWORK_SECTIONS: {
    id: NetworkEnvironment
    title: string
    description: string
}[] = [
        {
            id: "mainnet",
            title: "Mainnet",
            description:
                "Production networks. Transactions use real assets and cannot be reversed.",
        },
        {
            id: "testnet",
            title: "Testnet",
            description:
                "Development and testing networks. Use test funds only - no real value at risk.",
        },
    ]

export const NETWORK_OPTIONS: NetworkOption[] = [
    {
        id: "robinhood-testnet",
        label: "Robinhood Chain Testnet",
        shortLabel: "Robinhood Testnet",
        chainId: 46630,
        environment: "testnet",
        accent: "amber",
    },
    {
        id: "robinhood-mainnet",
        label: "Robinhood Chain Mainnet",
        shortLabel: "Robinhood Mainnet",
        chainId: 4663,
        environment: "mainnet",
        accent: "indigo",
    },
    {
        id: "ethereum",
        label: "Ethereum Mainnet",
        shortLabel: "Ethereum",
        chainId: 1,
        environment: "mainnet",
        accent: "blue",
    },
    {
        id: "ethereum-sepolia",
        label: "Ethereum Sepolia",
        shortLabel: "Sepolia",
        chainId: 11155111,
        environment: "testnet",
        accent: "sky",
    },
    {
        id: "polygon",
        label: "Polygon Mainnet",
        shortLabel: "Polygon",
        chainId: 137,
        environment: "mainnet",
        accent: "violet",
    },
]

function meta(network?: string | null): NetworkMeta {
    return NETWORK_META[normalizeNetworkId(network)]
}

export function getChainConfig(network?: string | null): Chain {
    return meta(network).chain
}

export function getChainId(network?: string | null): number {
    return meta(network).chain.id
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

const NETWORK_ICON_SRC: Record<NetworkId, string> = {
    "robinhood-testnet": "/chains/robinhood.png",
    "robinhood-mainnet": "/chains/robinhood.png",
    ethereum: "/chains/ethereum.png",
    "ethereum-sepolia": "/chains/ethereum.png",
    polygon: "/chains/polygon.png",
}

export function getNetworkIconSrc(network?: string | null): string {
    return NETWORK_ICON_SRC[normalizeNetworkId(network)]
}

export function getNativeCurrencySymbol(network?: string | null): string {
    return meta(network).nativeSymbol
}

export function getDexScreenerChainIds(network?: string | null): string[] {
    return meta(network).dexScreenerChainIds
}

export function isUniswapSwapSupported(network?: string | null): boolean {
    return meta(network).uniswapSupported
}

export function getUniversalRouterVersion(
    network?: string | null
): "2.0" | "2.1.1" {
    return meta(network).universalRouterVersion
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
