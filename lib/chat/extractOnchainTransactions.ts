import {
    getExplorerBaseUrl,
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "@/lib/web3/config"

export type ChatOnchainTx = {
    id: string
    kind: "swap" | "send_native" | "send_erc20"
    hash: string
    network: string
    explorerUrl: string
    inAmount: string | null
    inSymbol: string | null
    inIsNative: boolean
    outAmount: string | null
    outSymbol: string | null
    outIsNative: boolean
    createdAt: Date | string | null
    status?: string
}

type MessageLike = {
    id?: string
    role?: string
    createdAt?: Date | string | null
    parts?: readonly any[] | null
}

const TX_TOOLS = new Set(["swap_tokens", "send_native", "send_erc20"])

function asString(value: unknown): string | null {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function mapToolToTx(
    part: any,
    message: MessageLike
): ChatOnchainTx | null {
    const toolName = part?.toolName as string | undefined
    if (!toolName || !TX_TOOLS.has(toolName)) return null
    if (part.state !== "output-available") return null

    const output = part.output
    if (!output || output.success !== true) return null

    const hash = asString(output.hash)
    if (!hash) return null

    const network = normalizeNetworkId(output.network)
    const explorerUrl = `${getExplorerBaseUrl(network)}/tx/${hash}`
    const id = asString(part.toolCallId) || hash
    const createdAt = message.createdAt ?? null
    const status = asString(output.status) || undefined

    if (toolName === "swap_tokens") {
        const nativeSymbol = getNativeCurrencySymbol(network)
        const inSymbol = asString(output.tokenIn?.symbol) || "IN"
        const outSymbol = asString(output.tokenOut?.symbol) || "OUT"
        const inIsNative =
            output.tokenIn?.isNative === true ||
            inSymbol.toUpperCase() === nativeSymbol.toUpperCase()
        const outIsNative =
            output.tokenOut?.isNative === true ||
            outSymbol.toUpperCase() === nativeSymbol.toUpperCase()

        return {
            id,
            kind: "swap",
            hash,
            network,
            explorerUrl,
            inAmount: asString(output.amountIn),
            inSymbol,
            inIsNative,
            outAmount: asString(output.amountOut),
            outSymbol,
            outIsNative,
            createdAt,
            status,
        }
    }

    if (toolName === "send_native") {
        return {
            id,
            kind: "send_native",
            hash,
            network,
            explorerUrl,
            inAmount: null,
            inSymbol: null,
            inIsNative: false,
            outAmount: asString(output.amount),
            outSymbol: asString(output.symbol) || getNativeCurrencySymbol(network),
            outIsNative: true,
            createdAt,
            status,
        }
    }

    return {
        id,
        kind: "send_erc20",
        hash,
        network,
        explorerUrl,
        inAmount: null,
        inSymbol: null,
        inIsNative: false,
        outAmount: asString(output.amount),
        outSymbol: asString(output.tokenSymbol) || "TOKEN",
        outIsNative: false,
        createdAt,
        status,
    }
}

export function extractOnchainTransactions(
    messages: readonly MessageLike[]
): ChatOnchainTx[] {
    const byHash = new Map<string, ChatOnchainTx>()

    for (const message of messages) {
        if (!message?.parts?.length) continue
        for (const part of message.parts) {
            if (part?.type !== "dynamic-tool") continue
            const tx = mapToolToTx(part, message)
            if (!tx) continue
            const key = tx.hash.toLowerCase()
            if (!byHash.has(key)) {
                byHash.set(key, tx)
            }
        }
    }

    const list = Array.from(byHash.values())
    list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        if (tb !== ta) return tb - ta
        return a.hash.localeCompare(b.hash)
    })

    return list
}
