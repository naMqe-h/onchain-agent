import { formatUnits } from "viem"
import { getTokenBalancesApi, type NetworkId } from "./config"

export const ERC20_BALANCES_TOP_LIMIT = 10

export type BalanceToken = {
    name: string
    symbol: string
    address: string
    balance: string
    decimals: number
    valueUsd: number | null
    circulatingMarketCap: number | null
    volume24h: number | null
    iconUrl: string | null
}

export type FetchWalletErc20Options = {
    limit?: number
}

function parseDecimals(raw: unknown): number {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw
    const parsed = parseInt(String(raw ?? "18"), 10)
    return Number.isFinite(parsed) ? parsed : 18
}

function formatBalance(rawValue: string, decimals: number): string {
    try {
        return formatUnits(BigInt(rawValue), decimals)
    } catch {
        return (Number(rawValue) / Math.pow(10, decimals)).toString()
    }
}

function parseOptionalNumber(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === "") return null
    const n = parseFloat(String(raw))
    return Number.isFinite(n) ? n : null
}

function parseOptionalString(raw: unknown): string | null {
    if (raw === null || raw === undefined) return null
    const s = String(raw).trim()
    return s.length > 0 ? s : null
}

function computeValueUsd(
    rawValue: string,
    decimals: number,
    exchangeRate: unknown
): number | null {
    const rate = parseOptionalNumber(exchangeRate)
    if (rate === null || rate <= 0) return null

    try {
        const human = Number(formatUnits(BigInt(rawValue || "0"), decimals))
        if (!Number.isFinite(human)) return null
        const usd = human * rate
        return Number.isFinite(usd) ? usd : null
    } catch {
        return null
    }
}

export async function fetchWalletErc20Tokens(
    walletAddress: string,
    network?: string | null,
    options?: FetchWalletErc20Options
): Promise<
    | {
        ok: true
        tokens: BalanceToken[]
        networkId: NetworkId
        totalCount: number
        truncated: boolean
        limit: number | null
    }
    | { ok: false; error: string; networkId: NetworkId }
> {
    const { baseUrl, apiKey, networkId } = getTokenBalancesApi(network)

    if (!baseUrl) {
        return {
            ok: false,
            networkId,
            error: `Blockscout API URL is not configured for network "${networkId}".`,
        }
    }

    let url = `${baseUrl.replace(/\/$/, "")}/addresses/${walletAddress}/token-balances`
    if (apiKey) {
        url += `?apikey=${apiKey}`
    }

    const response = await fetch(url)
    if (!response.ok) {
        return {
            ok: false,
            networkId,
            error: `Failed to fetch token balances from explorer API (Status: ${response.status} ${response.statusText})`,
        }
    }

    const data = await response.json()
    const rawItems = Array.isArray(data)
        ? data
        : data && Array.isArray(data.items)
            ? data.items
            : []

    const tokens: BalanceToken[] = rawItems
        .filter((item: any) => item?.token?.type === "ERC-20")
        .map((item: any) => {
            const tokenInfo = item.token
            const rawValue = String(item.value || "0")
            const decimals = parseDecimals(tokenInfo.decimals)
            const formattedBalance = formatBalance(rawValue, decimals)
            const valueUsd = computeValueUsd(rawValue, decimals, tokenInfo.exchange_rate)

            return {
                name: tokenInfo.name || "Unknown Token",
                symbol: tokenInfo.symbol || "TOKEN",
                address: tokenInfo.address_hash || tokenInfo.address || "",
                balance: formattedBalance,
                decimals,
                valueUsd,
                circulatingMarketCap: parseOptionalNumber(tokenInfo.circulating_market_cap),
                volume24h: parseOptionalNumber(tokenInfo.volume_24h),
                iconUrl: parseOptionalString(tokenInfo.icon_url),
            }
        })
        .filter((t: BalanceToken) => /^0x[a-fA-F0-9]{40}$/.test(t.address))

    tokens.sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0))

    const totalCount = tokens.length
    const limit =
        typeof options?.limit === "number" && options.limit > 0 ? options.limit : null
    const truncated = limit !== null && totalCount > limit
    const resultTokens = limit !== null ? tokens.slice(0, limit) : tokens

    return {
        ok: true,
        tokens: resultTokens,
        networkId,
        totalCount,
        truncated,
        limit,
    }
}
