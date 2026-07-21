export type NetworkId =
    | 'base'
    | 'ethereum'
    | 'arbitrum'
    | 'polygon'
    | 'optimism'
    | 'blast'
    | 'avalanche'
    | 'bsc'
    | 'solana'
    | 'ink'
    | 'berachain'
    | 'unichain'
    | 'abstract'
    | 'hyperliquid'
    | 'sepolia'

export type NetworkEnvironment = 'mainnet' | 'testnet'

export type NetworkOption = {
    id: NetworkId
    name: string
    isTestnet: boolean
}

export type RegistryToken = {
    address: string
    symbol: string
    name: string
    decimals: number
    logoURI?: string
}

export type BalanceToken = {
    address: string
    symbol: string
    name: string
    decimals: number
    balance: string
    balanceFormatted: string
    logoURI?: string
}

export type FetchWalletErc20Options = {
    walletAddress: string
    network: NetworkId
    limit?: number
}

export type TxHistoryItem = {
    hash: string
    blockNumber?: string | number
    timeStamp?: string | number
    from: string
    to?: string
    value?: string
    tokenSymbol?: string
    tokenDecimal?: string
    isError?: string
}

export type FetchTxHistoryOptions = {
    walletAddress: string
    network: NetworkId
    limit?: number
}

export type ResolvedToken = {
    address: string
    symbol: string
    name: string
    decimals: number
}

export type ResolveTokenResult =
    | { success: true; token: ResolvedToken }
    | { success: false; error: string }

export type NamedAddressSource = 'literal' | 'wallet' | 'address_book'

export type ResolveNamedAddressResult = {
    address: string
    source: NamedAddressSource
} | null

export type ResolvedWallet = {
    address: string
    source: 'active_wallet'
} | null

export type PreparedSwapContext = {
    network: NetworkId
    tokenIn: ResolvedToken
    tokenOut: ResolvedToken
    amountIn: string
}

export type WaitForTxResult = {
    success: boolean
    hash: string
    blockNumber?: bigint
    status?: string
    error?: string
}

export type SupportStatus = 'supported' | 'unsupported' | 'partial'

export interface FeatureSupport {
    status: SupportStatus
    note?: string
}

export interface SwapTx {
    success?: boolean
    hash: string
    approvalHash?: string | null
    from?: string
    tokenIn?: {
        address: string
        symbol: string
        isNative?: boolean
    }
    tokenOut?: {
        address: string
        symbol: string
        isNative?: boolean
    }
    amountIn?: string
    amountOut?: string | null
    slippageTolerance?: number
    routing?: string
    gasUsed?: string | null
    gasPriceGwei?: string | null
    gasFeeEth?: string | null
    gasFeeNative?: string | null
    nativeSymbol?: string
    status: string
    pendingReason?: string | null
    network: string
}

export interface SendNativeTx {
    success?: boolean
    hash: string
    from?: string
    to?: string
    amount: string
    symbol?: string
    gasUsed?: string | null
    gasPriceGwei?: string | null
    gasFeeEth?: string | null
    gasFeeNative?: string | null
    status: string
    pendingReason?: string | null
    network?: string
}

export interface SendErc20Tx {
    success?: boolean
    hash: string
    from?: string
    to?: string
    tokenAddress?: string
    tokenSymbol?: string | null
    amount: string
    gasUsed?: string | null
    gasPriceGwei?: string | null
    gasFeeEth?: string | null
    gasFeeNative?: string | null
    nativeSymbol?: string
    status: string
    pendingReason?: string | null
    network: string
}

export type TxHistoryRow = {
    hash: string
    timestamp: string
    status?: 'success' | 'reverted' | 'pending' | 'unknown' | string
    from: string
    to: string | null
    value: string
    fee?: string | null
    method?: string | null
}

export type TxHistoryData = {
    success?: boolean
    address: string
    network: string
    symbol?: string
    totalCount?: number
    returnedCount?: number
    transactions: TxHistoryRow[]
}

export type TokenBalanceRow = {
    address: string
    symbol: string
    name: string
    balance: string
    decimals?: number
    valueUsd?: number | null
    circulatingMarketCap?: number | null
    volume24h?: number | null
    iconUrl?: string | null
}

export type TokenBalancesData = {
    success?: boolean
    walletAddress?: string
    address?: string
    network: string
    totalCount?: number
    returnedCount?: number
    truncated?: boolean
    note?: string
    tokens: TokenBalanceRow[]
}

export type TrendingToken = {
    rank?: number
    poolAddress?: string
    poolName?: string
    tokenAddress?: string
    address?: string
    name: string
    symbol: string
    imageUrl?: string | null
    priceUsd?: number | string | null
    fdvUsd?: number | null
    marketCapUsd?: number | null
    volume24hUsd?: number | string | null
    reserveUsd?: number | null
    priceChangePercentage24h?: number | null
    priceChangePercentage1h?: number | null
    dexName?: string
    transactions24h?: {
        buys: number
        sells: number
        buyers: number
        sellers: number
    }
}

export type TokenInfo = {
    address: string
    symbol: string
    name: string
    decimals?: number
    totalSupply?: string
    imageUrl?: string
    priceUsd?: string
    priceNative?: string
    volume24h?: number
    fdv?: number
    marketCap?: number
    network?: string
    explorerBaseUrl?: string
    bestPair?: {
        dexId?: string
        pairAddress?: string
        quoteTokenSymbol?: string
        liquidityUsd?: number
        url?: string
    }
    websites?: Array<{ label?: string; url?: string }>
    socials?: Array<{ type?: string; url?: string }>
}
