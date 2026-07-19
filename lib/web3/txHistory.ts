import { formatUnits } from "viem"
import { getTokenBalancesApi, type NetworkId } from "./config"

export type TxHistoryItem = {
    hash: string
    timestamp: string
    status: 'success' | 'reverted' | 'pending' | 'unknown'
    from: string
    to: string | null
    value: string
    fee: string | null
    method: string | null
}

export type FetchTxHistoryOptions = {
    limit?: number
}

function parseStatus(rawStatus: unknown): 'success' | 'reverted' | 'pending' | 'unknown' {
    if (typeof rawStatus !== 'string') return 'unknown'
    const s = rawStatus.toLowerCase()
    if (s === 'ok' || s === 'success') return 'success'
    if (s === 'error' || s === 'failure' || s === 'reverted') return 'reverted'
    if (s === 'pending' || s === 'awaiting') return 'pending'
    return 'unknown'
}

export async function fetchWalletTxHistory(
    walletAddress: string,
    network?: string | null,
    options?: FetchTxHistoryOptions
): Promise<
    | {
          ok: true
          transactions: TxHistoryItem[]
          networkId: NetworkId
          totalCount: number
          limit: number | null
      }
    | { ok: false; error: string; networkId: NetworkId }
> {
    const { baseUrl, apiKey, networkId } = getTokenBalancesApi(network)

    if (!baseUrl) {
        return {
            ok: false,
            networkId,
            error: `Blockscout API URL is not configured for network "${networkId}".`
        }
    }

    let url = `${baseUrl.replace(/\/$/, '')}/addresses/${walletAddress}/transactions`
    if (apiKey) {
        url += `?apikey=${apiKey}`
    }

    const response = await fetch(url)
    if (!response.ok) {
        return {
            ok: false,
            networkId,
            error: `Failed to fetch transaction history from explorer API (Status: ${response.status} ${response.statusText})`
        }
    }

    const data = await response.json()
    const rawItems = Array.isArray(data)
        ? data
        : data && Array.isArray(data.items)
            ? data.items
            : []

    const transactions: TxHistoryItem[] = rawItems.map((item: any) => {
        const hash = item.hash || ''
        const timestamp = item.timestamp || ''
        const status = parseStatus(item.status)
        const from = item.from?.hash || ''
        const to = item.to?.hash || null

        let value = '0'
        if (item.value) {
            try {
                value = formatUnits(BigInt(item.value), 18)
            } catch {
                value = (Number(item.value) / 1e18).toString()
            }
        }

        let fee = null
        if (item.fee?.value) {
            try {
                fee = formatUnits(BigInt(item.fee.value), 18)
            } catch {
                fee = (Number(item.fee.value) / 1e18).toString()
            }
        }

        const method = item.method || null

        return {
            hash,
            timestamp,
            status,
            from,
            to,
            value,
            fee,
            method
        }
    })

    const limit = typeof options?.limit === 'number' && options.limit > 0 ? options.limit : null
    const resultTxs = limit !== null ? transactions.slice(0, limit) : transactions

    return {
        ok: true,
        transactions: resultTxs,
        networkId,
        totalCount: transactions.length,
        limit
    }
}
