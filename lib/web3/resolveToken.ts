import { createPublicClient, erc20Abi, http, isAddress } from "viem"
import db from "../db"
import {
    getChainConfig,
    getDexScreenerChainIds,
    getNativeCurrencySymbol,
    getNetworkLabel,
    type NetworkId,
} from "./config"
import { fetchWalletErc20Tokens, type BalanceToken } from "./tokenBalances"
import { lookupRegistryToken, type RegistryToken } from "./tokenRegistry"
import { NATIVE_TOKEN_ADDRESS } from "./uniswap/client"

export type ResolvedToken = {
    address: string
    symbol: string
    name: string
    decimals: number
    isNative: boolean
    source: "native" | "address" | "balances" | "registry" | "dexscreener" | "coinbook"
}

export type ResolveTokenResult =
    | { ok: true; token: ResolvedToken }
    | {
        ok: false
        error: string
        candidates?: Array<{
            symbol: string
            name: string
            address: string
            source?: string
        }>
    }

function isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function isNativeQuery(query: string, network: NetworkId): boolean {
    const q = query.trim().toLowerCase()
    if (!q) return false
    if (["native", "eth", "ether", "ethereum"].includes(q)) {
        return getNativeCurrencySymbol(network) === "ETH"
    }
    if (["pol", "matic", "polygon"].includes(q)) {
        return getNativeCurrencySymbol(network) === "POL"
    }
    const native = getNativeCurrencySymbol(network).toLowerCase()
    return q === native
}

function matchFromBalances(
    query: string,
    tokens: BalanceToken[]
):
    | { ok: true; token: BalanceToken }
    | { ok: false; error: string; candidates?: BalanceToken[] } {
    const q = query.trim().toLowerCase()

    const symbolExact = tokens.filter((t) => t.symbol.toLowerCase() === q)
    if (symbolExact.length === 1) return { ok: true, token: symbolExact[0] }
    if (symbolExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match symbol "${query}". Specify the contract address.`,
            candidates: symbolExact,
        }
    }

    const nameExact = tokens.filter((t) => t.name.toLowerCase() === q)
    if (nameExact.length === 1) return { ok: true, token: nameExact[0] }
    if (nameExact.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens match name "${query}". Specify the contract address.`,
            candidates: nameExact,
        }
    }

    const partial = tokens.filter(
        (t) =>
            t.name.toLowerCase().includes(q) ||
            t.symbol.toLowerCase().includes(q)
    )
    if (partial.length === 1) return { ok: true, token: partial[0] }
    if (partial.length > 1) {
        return {
            ok: false,
            error: `Multiple tokens partially match "${query}". Specify the contract address.`,
            candidates: partial,
        }
    }

    return {
        ok: false,
        error: `No token matching "${query}" in wallet balances.`,
    }
}

async function readErc20Meta(
    address: `0x${string}`,
    network: NetworkId
): Promise<{ symbol: string; name: string; decimals: number } | null> {
    try {
        const publicClient = createPublicClient({
            chain: getChainConfig(network),
            transport: http(),
        })
        const [decimals, symbol, name] = await Promise.all([
            publicClient.readContract({
                address,
                abi: erc20Abi,
                functionName: "decimals",
            }),
            publicClient
                .readContract({
                    address,
                    abi: erc20Abi,
                    functionName: "symbol",
                })
                .catch(() => "UNKNOWN"),
            publicClient
                .readContract({
                    address,
                    abi: erc20Abi,
                    functionName: "name",
                })
                .catch(() => "Unknown Token"),
        ])
        return {
            decimals: Number(decimals),
            symbol: String(symbol),
            name: String(name),
        }
    } catch {
        return null
    }
}

async function searchDexScreener(
    query: string,
    network: NetworkId
): Promise<ResolvedToken | null> {
    const allowed = new Set(
        getDexScreenerChainIds(network).map((id) => id.toLowerCase())
    )
    try {
        const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`
        const response = await fetch(url)
        if (!response.ok) return null
        const data = await response.json()
        const pairs = Array.isArray(data?.pairs) ? data.pairs : []

        type Cand = { address: string; symbol: string; name: string; volume: number }
        const byAddress = new Map<string, Cand>()

        for (const pair of pairs) {
            const chainId = String(pair?.chainId || "").toLowerCase()
            if (!allowed.has(chainId)) continue
            const base = pair?.baseToken
            if (!base?.address) continue
            const addr = String(base.address)
            const volume = parseFloat(pair?.volume?.h24 || "0") || 0
            const existing = byAddress.get(addr.toLowerCase())
            if (!existing || volume > existing.volume) {
                byAddress.set(addr.toLowerCase(), {
                    address: addr,
                    symbol: base.symbol || "UNKNOWN",
                    name: base.name || "Unknown Token",
                    volume,
                })
            }
        }

        const cands = Array.from(byAddress.values()).sort(
            (a, b) => b.volume - a.volume
        )
        if (cands.length === 0) return null

        const q = query.trim().toLowerCase()
        const symbolHits = cands.filter(
            (c) => c.symbol.toLowerCase() === q
        )
        const pick = symbolHits[0] ?? cands[0]

        const meta = await readErc20Meta(pick.address as `0x${string}`, network)
        return {
            address: pick.address,
            symbol: meta?.symbol || pick.symbol,
            name: meta?.name || pick.name,
            decimals: meta?.decimals ?? 18,
            isNative: false,
            source: "dexscreener",
        }
    } catch {
        return null
    }
}

function registryToResolved(t: RegistryToken): ResolvedToken {
    return {
        address: t.address,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        isNative: false,
        source: "registry",
    }
}

export async function resolveToken(params: {
    query: string
    network: NetworkId
    walletAddress?: string
    role?: "in" | "out"
    userId?: string
}): Promise<ResolveTokenResult> {
    const query = params.query.trim()
    if (!query) {
        return { ok: false, error: "Token query cannot be empty." }
    }

    const network = params.network
    const networkLabel = getNetworkLabel(network)

    if (isNativeQuery(query, network)) {
        const symbol = getNativeCurrencySymbol(network)
        return {
            ok: true,
            token: {
                address: NATIVE_TOKEN_ADDRESS,
                symbol,
                name: symbol === "POL" ? "Polygon" : "Ether",
                decimals: 18,
                isNative: true,
                source: "native",
            },
        }
    }

    if (isValidEvmAddress(query) && isAddress(query)) {
        if (query.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
            const symbol = getNativeCurrencySymbol(network)
            return {
                ok: true,
                token: {
                    address: NATIVE_TOKEN_ADDRESS,
                    symbol,
                    name: symbol === "POL" ? "Polygon" : "Ether",
                    decimals: 18,
                    isNative: true,
                    source: "address",
                },
            }
        }

        const meta = await readErc20Meta(query as `0x${string}`, network)
        if (!meta) {
            return {
                ok: false,
                error: `Address ${query} is not a readable ERC-20 on ${networkLabel}.`,
            }
        }
        return {
            ok: true,
            token: {
                address: query,
                symbol: meta.symbol,
                name: meta.name,
                decimals: meta.decimals,
                isNative: false,
                source: "address",
            },
        }
    }

    if (params.userId) {
        try {
            const savedCoin = await db.coinBookEntry.findFirst({
                where: {
                    userId: params.userId,
                    OR: [
                        { symbol: { equals: query, mode: "insensitive" } },
                        { name: { equals: query, mode: "insensitive" } },
                    ],
                },
            })

            if (savedCoin) {
                const meta = await readErc20Meta(
                    savedCoin.address as `0x${string}`,
                    network
                )
                return {
                    ok: true,
                    token: {
                        address: savedCoin.address,
                        symbol: meta?.symbol || savedCoin.symbol,
                        name: meta?.name || savedCoin.name,
                        decimals: meta?.decimals ?? 18,
                        isNative: false,
                        source: "coinbook",
                    },
                }
            }
        } catch {
            // Ignore DB error and fallback to standard resolution
        }
    }

    if (params.walletAddress && params.role !== "out") {
        const balances = await fetchWalletErc20Tokens(
            params.walletAddress,
            network
        )
        if (balances.ok && balances.tokens.length > 0) {
            const match = matchFromBalances(query, balances.tokens)
            if (match.ok) {
                return {
                    ok: true,
                    token: {
                        address: match.token.address,
                        symbol: match.token.symbol,
                        name: match.token.name,
                        decimals: match.token.decimals,
                        isNative: false,
                        source: "balances",
                    },
                }
            }
            if (match.candidates && match.candidates.length > 1) {
                return {
                    ok: false,
                    error: match.error,
                    candidates: match.candidates.map((t) => ({
                        symbol: t.symbol,
                        name: t.name,
                        address: t.address,
                        source: "balances",
                    })),
                }
            }
        }
    }

    const registry = lookupRegistryToken(network, query)
    if (registry) {
        return { ok: true, token: registryToResolved(registry) }
    }

    const dex = await searchDexScreener(query, network)
    if (dex) {
        return { ok: true, token: dex }
    }

    return {
        ok: false,
        error: `Could not resolve token "${query}" on ${networkLabel}. Provide a contract address (0x…) or a clearer ticker.`,
    }
}
