import {
    createPublicClient,
    createWalletClient,
    fallback,
    http,
    type Account,
    type Chain,
    type PublicClient,
    type Transport,
    type WalletClient,
} from "viem"
import { getChainConfig, normalizeNetworkId, type NetworkId } from "./config"

const fallbackPublicUrls: Record<NetworkId, string[]> = {
    ethereum: [
        "https://eth.llamarpc.com",
        "https://rpc.ankr.com/eth",
        "https://cloudflare-eth.com",
    ],
    "ethereum-sepolia": [
        "https://rpc.sepolia.org",
        "https://ethereum-sepolia-rpc.publicnode.com",
    ],
    polygon: [
        "https://polygon-rpc.com",
        "https://rpc.ankr.com/polygon",
    ],
    "robinhood-testnet": [
        "https://rpc.testnet.chain.robinhood.com",
    ],
    robinhood: [
        "https://rpc.mainnet.chain.robinhood.com",
    ],
}

function getNetworkRpcUrls(networkId: NetworkId): string[] {
    const chain = getChainConfig(networkId)
    const primaryUrls = (chain.rpcUrls.default.http || []).filter(Boolean)
    const fallbacks = fallbackPublicUrls[networkId] || []

    const allUrls = [...primaryUrls, ...fallbacks]
    const uniqueUrls = Array.from(
        new Set(
            allUrls.filter(
                (url) => typeof url === "string" && url.trim().length > 0
            )
        )
    )

    return uniqueUrls
}

function createTransportForNetwork(networkId: NetworkId): Transport {
    const urls = getNetworkRpcUrls(networkId)
    if (urls.length === 0) {
        return http()
    }
    if (urls.length === 1) {
        return http(urls[0], { timeout: 10_000 })
    }
    const transports = urls.map((url) => http(url, { timeout: 10_000 }))
    return fallback(transports, { rank: true, retryCount: 3 })
}

export type ApplicationPublicClient = PublicClient<Transport, Chain>
export type ApplicationWalletClient = WalletClient<Transport, Chain, Account>

const publicClientCache = new Map<NetworkId, ApplicationPublicClient>()
const walletClientCache = new Map<string, ApplicationWalletClient>()

export function getPublicClient(
    network?: string | null
): ApplicationPublicClient {
    const networkId = normalizeNetworkId(network)
    const cached = publicClientCache.get(networkId)
    if (cached) {
        return cached
    }

    const chain = getChainConfig(networkId)
    const transport = createTransportForNetwork(networkId)
    const client = createPublicClient({
        chain,
        transport,
    })

    publicClientCache.set(networkId, client)
    return client
}

export function getWalletClient(
    account: Account,
    network?: string | null
): ApplicationWalletClient {
    const networkId = normalizeNetworkId(network)
    const cacheKey = `${networkId}:${account.address.toLowerCase()}`
    const cached = walletClientCache.get(cacheKey)
    if (cached) {
        return cached
    }

    const chain = getChainConfig(networkId)
    const transport = createTransportForNetwork(networkId)
    const client = createWalletClient({
        account,
        chain,
        transport,
    })

    walletClientCache.set(cacheKey, client)
    return client
}

export function clearClientCache(): void {
    publicClientCache.clear()
    walletClientCache.clear()
}
