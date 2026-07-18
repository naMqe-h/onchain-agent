import {
    formatEther,
    formatGwei,
    type Hash,
    type TransactionReceipt,
} from "viem"

export const DEFAULT_TX_RECEIPT_TIMEOUT_MS = (() => {
    const raw = process.env.TX_RECEIPT_TIMEOUT_MS
    if (raw) {
        const n = parseInt(raw, 10)
        if (Number.isFinite(n) && n >= 5_000 && n <= 300_000) return n
    }
    return 45_000
})()

export const DEFAULT_TX_POLLING_INTERVAL_MS = 2_000

export type WaitForTxResult =
    | {
        status: "confirmed"
        receipt: TransactionReceipt
    }
    | {
        status: "pending"
        reason: string
    }

type PublicClientLike = {
    waitForTransactionReceipt: (args: {
        hash: Hash
        timeout?: number
        pollingInterval?: number
        confirmations?: number
    }) => Promise<TransactionReceipt>
}

export async function waitForTxReceipt(
    publicClient: PublicClientLike,
    hash: Hash,
    options?: {
        timeoutMs?: number
        pollingIntervalMs?: number
        confirmations?: number
    }
): Promise<WaitForTxResult> {
    const timeout = options?.timeoutMs ?? DEFAULT_TX_RECEIPT_TIMEOUT_MS
    const pollingInterval =
        options?.pollingIntervalMs ?? DEFAULT_TX_POLLING_INTERVAL_MS
    const confirmations = options?.confirmations ?? 1

    try {
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout,
            pollingInterval,
            confirmations,
        })
        return { status: "confirmed", receipt }
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : String(error ?? "unknown")

        const isTimeout =
            /timeout|timed out|WaitForTransactionReceiptTimeoutError/i.test(
                message
            )

        if (isTimeout) {
            return {
                status: "pending",
                reason: `Confirmation not observed within ${Math.round(timeout / 1000)}s. Transaction may still succeed - check the explorer.`,
            }
        }

        return {
            status: "pending",
            reason: `Could not confirm receipt yet (${message}). Transaction may still succeed - check the explorer.`,
        }
    }
}

export function gasFieldsFromReceipt(receipt: TransactionReceipt): {
    gasUsed: string
    gasPriceGwei: string
    gasFeeNative: string
} {
    const gasUsed = receipt.gasUsed.toString()
    const gasPriceGwei = receipt.effectiveGasPrice
        ? formatGwei(receipt.effectiveGasPrice)
        : "0"
    const gasFeeNative = formatEther(
        receipt.gasUsed * (receipt.effectiveGasPrice || BigInt(0))
    )
    return { gasUsed, gasPriceGwei, gasFeeNative }
}
