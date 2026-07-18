import { isAddress, isHex } from "viem"
import {
    getUniversalRouterVersion,
    type NetworkId,
} from "../config"
import type {
    CheckApprovalResponse,
    QuoteRequestParams,
    QuoteResponse,
    SwapResponse,
    TransactionRequest,
    UniversalRouterVersion,
} from "./types"

const API_BASE = "https://trade-api.gateway.uniswap.org/v1"

export const NATIVE_TOKEN_ADDRESS =
    "0x0000000000000000000000000000000000000000"

function getApiKey(): string {
    const key = process.env.UNISWAP_API_KEY?.trim()
    if (!key) {
        throw new Error(
            "UNISWAP_API_KEY is not configured. Add it to your environment to enable swaps."
        )
    }
    return key
}

function headers(version: UniversalRouterVersion): HeadersInit {
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": getApiKey(),
        "x-universal-router-version": version,
    }
}

function extractErrorMessage(body: unknown, status: number, statusText: string): string {
    if (body && typeof body === "object") {
        const o = body as Record<string, unknown>
        if (typeof o.detail === "string" && o.detail.trim()) return o.detail
        if (typeof o.message === "string" && o.message.trim()) return o.message
        if (typeof o.error === "string" && o.error.trim()) return o.error
        if (o.error && typeof o.error === "object") {
            const nested = o.error as Record<string, unknown>
            if (typeof nested.message === "string") return nested.message
        }
    }
    if (status === 401) return "Invalid or missing Uniswap API key (UNISWAP_API_KEY)."
    if (status === 404) return "No swap route found for this token pair on the active network."
    if (status === 429) return "Uniswap API rate limit exceeded. Try again in a moment."
    return `Uniswap API error (${status} ${statusText})`
}

async function postJson<T>(
    path: string,
    body: unknown,
    version: UniversalRouterVersion
): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: headers(version),
        body: JSON.stringify(body),
    })

    let data: unknown
    try {
        data = await response.json()
    } catch {
        data = null
    }

    if (!response.ok) {
        throw new Error(extractErrorMessage(data, response.status, response.statusText))
    }

    return data as T
}

export function isNativeTokenAddress(address: string): boolean {
    return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
}

export function isUniswapXRouting(routing: string): boolean {
    return (
        routing === "DUTCH_V2" ||
        routing === "DUTCH_V3" ||
        routing === "PRIORITY"
    )
}

export function prepareSwapRequest(
    quoteResponse: QuoteResponse,
    signature?: string
): Record<string, unknown> {
    const { permitData, permitTransaction, ...cleanQuote } = quoteResponse
    const request: Record<string, unknown> = { ...cleanQuote }

    if (isUniswapXRouting(quoteResponse.routing)) {
        if (signature) request.signature = signature
    } else if (
        signature &&
        permitData &&
        typeof permitData === "object"
    ) {
        request.signature = signature
        request.permitData = permitData
    }

    return request
}

export function validateSwapTransaction(swap: TransactionRequest): void {
    if (!swap?.data || swap.data === "" || swap.data === "0x") {
        throw new Error("swap.data is empty — quote may have expired. Retry the swap.")
    }
    if (!isHex(swap.data as `0x${string}`)) {
        throw new Error("swap.data is not valid hex.")
    }
    if (!swap.to || !isAddress(swap.to)) {
        throw new Error("swap.to is not a valid address.")
    }
    if (!swap.from || !isAddress(swap.from)) {
        throw new Error("swap.from is not a valid address.")
    }
    if (swap.value === undefined || swap.value === null) {
        throw new Error("swap.value is missing.")
    }
}

export function getOutputAmountRaw(quoteResponse: QuoteResponse): string | null {
    if (isUniswapXRouting(quoteResponse.routing)) {
        const first = quoteResponse.quote?.orderInfo?.outputs?.[0]
        return first?.startAmount ?? null
    }
    return quoteResponse.quote?.output?.amount ?? null
}

export function getInputAmountRaw(quoteResponse: QuoteResponse): string | null {
    if (isUniswapXRouting(quoteResponse.routing)) {
        return quoteResponse.quote?.orderInfo?.input?.startAmount ?? null
    }
    return quoteResponse.quote?.input?.amount ?? null
}

export async function checkApproval(params: {
    walletAddress: string
    token: string
    amount: string
    chainId: number
    network: NetworkId
}): Promise<CheckApprovalResponse> {
    const version = getUniversalRouterVersion(params.network)
    return postJson<CheckApprovalResponse>(
        "/check_approval",
        {
            walletAddress: params.walletAddress,
            token: params.token,
            amount: params.amount,
            chainId: params.chainId,
        },
        version
    )
}

export async function getQuote(
    params: QuoteRequestParams & { network: NetworkId }
): Promise<QuoteResponse> {
    const version = getUniversalRouterVersion(params.network)
    const protocols = params.protocols ?? ["V2", "V3", "V4"]

    return postJson<QuoteResponse>(
        "/quote",
        {
            type: "EXACT_INPUT",
            amount: params.amount,
            tokenInChainId: params.chainId,
            tokenOutChainId: params.chainId,
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            swapper: params.swapper,
            slippageTolerance: params.slippageTolerance,
            routingPreference: "BEST_PRICE",
            protocols,
        },
        version
    )
}

export async function createSwap(
    quoteResponse: QuoteResponse,
    network: NetworkId,
    signature?: string
): Promise<SwapResponse> {
    const version = getUniversalRouterVersion(network)
    const body = prepareSwapRequest(quoteResponse, signature)
    return postJson<SwapResponse>("/swap", body, version)
}
