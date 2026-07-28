import { formatUnits, formatGwei, createPublicClient, http } from "viem"
import { getTokenBalancesApi, getChainConfig, type NetworkId } from "./config"
import type { TxDetailsItem, TxTokenTransfer } from "../../types/web3"

export type FetchTxDetailsResult =
    | {
        ok: true
        tx: TxDetailsItem
        networkId: NetworkId
    }
    | { ok: false; error: string; networkId: NetworkId }

function parseStatus(rawStatus: unknown, receiptStatus?: string): 'success' | 'reverted' | 'pending' | 'unknown' {
    if (receiptStatus === 'success' || receiptStatus === 'reverted') {
        return receiptStatus
    }
    if (typeof rawStatus !== 'string') return 'unknown'
    const s = rawStatus.toLowerCase()
    if (s === 'ok' || s === 'success') return 'success'
    if (s === 'error' || s === 'failure' || s === 'reverted') return 'reverted'
    if (s === 'pending' || s === 'awaiting') return 'pending'
    return 'unknown'
}

export async function fetchTxDetails(
    txHash: string,
    network?: string | null
): Promise<FetchTxDetailsResult> {
    const cleanHash = txHash.trim()
    const { baseUrl, apiKey, networkId } = getTokenBalancesApi(network)

    if (!cleanHash.startsWith('0x') || cleanHash.length !== 66) {
        return {
            ok: false,
            networkId,
            error: 'Invalid transaction hash format. Must be a 66-character hex string starting with 0x.'
        }
    }

    if (baseUrl) {
        try {
            let url = `${baseUrl.replace(/\/$/, '')}/transactions/${cleanHash}`
            if (apiKey) {
                url += `?apikey=${apiKey}`
            }

            const response = await fetch(url)
            if (response.ok) {
                const item = await response.json()
                if (item && item.hash) {
                    const status = parseStatus(item.status || item.result)
                    const from = typeof item.from === 'string' ? item.from : (item.from?.hash || '')
                    const to = typeof item.to === 'string' ? item.to : (item.to?.hash || null)

                    let value = '0'
                    if (item.value) {
                        try {
                            value = formatUnits(BigInt(item.value), 18)
                        } catch {
                            value = (Number(item.value) / 1e18).toString()
                        }
                    }

                    let fee: string | null = null
                    if (item.fee?.value) {
                        try {
                            fee = formatUnits(BigInt(item.fee.value), 18)
                        } catch {
                            fee = (Number(item.fee.value) / 1e18).toString()
                        }
                    }

                    let gasUsed: string | null = null
                    if (item.gas_used) {
                        gasUsed = String(item.gas_used)
                    }

                    let gasPrice: string | null = null
                    if (item.gas_price) {
                        try {
                            gasPrice = formatGwei(BigInt(item.gas_price))
                        } catch {
                            gasPrice = null
                        }
                    }

                    const tokenTransfers: TxTokenTransfer[] = []
                    if (Array.isArray(item.token_transfers)) {
                        for (const tt of item.token_transfers) {
                            const ttFrom = typeof tt.from === 'string' ? tt.from : (tt.from?.hash || '')
                            const ttTo = typeof tt.to === 'string' ? tt.to : (tt.to?.hash || '')
                            const symbol = tt.token?.symbol || 'TOKEN'
                            const decimals = Number(tt.token?.decimals) || 18
                            const rawVal = tt.total?.value || tt.value || '0'
                            let amount = '0'
                            try {
                                amount = formatUnits(BigInt(rawVal), decimals)
                            } catch {
                                amount = rawVal
                            }
                            tokenTransfers.push({
                                from: ttFrom,
                                to: ttTo,
                                tokenSymbol: symbol,
                                tokenAddress: tt.token?.address || tt.token?.contract_address_hash,
                                amount
                            })
                        }
                    }

                    return {
                        ok: true,
                        networkId,
                        tx: {
                            hash: item.hash,
                            status,
                            blockNumber: item.block || item.block_number || null,
                            confirmations: typeof item.confirmations === 'number' ? item.confirmations : null,
                            timestamp: item.timestamp || null,
                            from,
                            to,
                            value,
                            fee,
                            gasUsed,
                            gasPrice,
                            method: item.method || null,
                            nonce: typeof item.nonce === 'number' ? item.nonce : null,
                            tokenTransfers: tokenTransfers.length > 0 ? tokenTransfers : undefined
                        }
                    }
                }
            }
        } catch { }
    }

    try {
        const chain = getChainConfig(networkId)
        const publicClient = createPublicClient({
            chain,
            transport: http()
        })

        const [tx, receipt] = await Promise.all([
            publicClient.getTransaction({ hash: cleanHash as `0x${string}` }),
            publicClient.getTransactionReceipt({ hash: cleanHash as `0x${string}` }).catch(() => null)
        ])

        if (!tx) {
            return {
                ok: false,
                networkId,
                error: `Transaction ${cleanHash} was not found on network "${networkId}".`
            }
        }

        const status: 'success' | 'reverted' | 'pending' | 'unknown' = receipt
            ? receipt.status === 'success'
                ? 'success'
                : 'reverted'
            : 'pending'

        let fee: string | null = null
        if (receipt && receipt.gasUsed && tx.gasPrice) {
            try {
                const totalFeeWei = receipt.gasUsed * tx.gasPrice
                fee = formatUnits(totalFeeWei, 18)
            } catch {
                fee = null
            }
        }

        let gasPriceGwei: string | null = null
        if (tx.gasPrice) {
            try {
                gasPriceGwei = formatGwei(tx.gasPrice)
            } catch {
                gasPriceGwei = null
            }
        }

        return {
            ok: true,
            networkId,
            tx: {
                hash: tx.hash,
                status,
                blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
                confirmations: null,
                timestamp: null,
                from: tx.from,
                to: tx.to || null,
                value: formatUnits(tx.value, 18),
                fee,
                gasUsed: receipt ? receipt.gasUsed.toString() : null,
                gasPrice: gasPriceGwei,
                method: tx.input && tx.input !== '0x' ? 'contract_call' : 'transfer',
                nonce: tx.nonce
            }
        }
    } catch (err: any) {
        return {
            ok: false,
            networkId,
            error: err.message || `Failed to retrieve transaction details for ${cleanHash}`
        }
    }
}
