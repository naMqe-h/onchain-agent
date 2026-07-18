export type UniversalRouterVersion = "2.0" | "2.1.1"

export type UniswapRouting =
    | "CLASSIC"
    | "WRAP"
    | "UNWRAP"
    | "DUTCH_V2"
    | "DUTCH_V3"
    | "PRIORITY"
    | "BRIDGE"
    | string

export type TransactionRequest = {
    to: string
    from: string
    data: string
    value: string
    chainId: number
    gasLimit?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    gasPrice?: string
}

export type PermitData = {
    domain: Record<string, unknown>
    types: Record<string, Array<{ name: string; type: string }>>
    values: Record<string, unknown>
    primaryType?: string
}

export type QuoteAmount = {
    token: string
    amount: string
}

export type ClassicQuoteBody = {
    input: QuoteAmount
    output: QuoteAmount
    slippage?: number
    route?: unknown[]
    gasFee?: string
    gasFeeUSD?: string
    gasUseEstimate?: string
    gasUseEstimateUSD?: string
}

export type UniswapXQuoteBody = {
    orderInfo?: {
        outputs?: Array<{
            token: string
            startAmount: string
            endAmount: string
            recipient?: string
        }>
        input?: {
            token: string
            startAmount: string
            endAmount: string
        }
        deadline?: number
        nonce?: string
    }
    encodedOrder?: string
    orderHash?: string
}

export type QuoteResponse = {
    requestId?: string
    routing: UniswapRouting
    quote: ClassicQuoteBody & UniswapXQuoteBody
    permitData?: PermitData | null
    permitTransaction?: TransactionRequest | null
    isTokenApprovalApplicable?: boolean
    [key: string]: unknown
}

export type CheckApprovalResponse = {
    requestId?: string
    approval: TransactionRequest | null
    cancel?: TransactionRequest | null
    [key: string]: unknown
}

export type SwapResponse = {
    requestId?: string
    swap: TransactionRequest
    [key: string]: unknown
}

export type QuoteRequestParams = {
    tokenIn: string
    tokenOut: string
    amount: string
    swapper: string
    chainId: number
    slippageTolerance: number
    protocols?: string[]
}
