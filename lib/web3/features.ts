import { type NetworkId } from './config'

export type SupportStatus = 'supported' | 'unsupported' | 'partial'

export interface FeatureSupport {
    name: string
    description: string
    support: Record<NetworkId, { status: SupportStatus; details?: string }>
}

export const FEATURES_REGISTRY: FeatureSupport[] = [
    {
        name: 'Send Native Tokens',
        description: 'Transfer native gas tokens (ETH or POL) to other addresses.',
        support: {
            'robinhood-testnet': { status: 'supported', details: 'Supported' },
            'robinhood-mainnet': { status: 'supported', details: 'Supported' },
            'ethereum': { status: 'supported', details: 'Supported' },
            'ethereum-sepolia': { status: 'supported', details: 'Supported' },
            'polygon': { status: 'supported', details: 'Supported' },
        }
    },
    {
        name: 'Send ERC-20 Tokens',
        description: 'Transfer ERC-20 tokens (e.g. USDC, WETH, custom tokens).',
        support: {
            'robinhood-testnet': { status: 'supported', details: 'Supported' },
            'robinhood-mainnet': { status: 'supported', details: 'Supported' },
            'ethereum': { status: 'supported', details: 'Supported' },
            'ethereum-sepolia': { status: 'supported', details: 'Supported' },
            'polygon': { status: 'supported', details: 'Supported' },
        }
    },
    {
        name: 'Token Balances',
        description: 'Query native and ERC-20 token balances for any address.',
        support: {
            'robinhood-testnet': { status: 'supported', details: 'Supported' },
            'robinhood-mainnet': { status: 'supported', details: 'Supported' },
            'ethereum': { status: 'supported', details: 'Supported' },
            'ethereum-sepolia': { status: 'supported', details: 'Supported' },
            'polygon': { status: 'supported', details: 'Supported' },
        }
    },
    {
        name: 'Token Info',
        description: 'Fetch name, symbol, decimals, and supply for a specific token address.',
        support: {
            'robinhood-testnet': { status: 'partial', details: 'Missing informations' },
            'robinhood-mainnet': { status: 'supported', details: 'Supported' },
            'ethereum': { status: 'supported', details: 'Supported' },
            'ethereum-sepolia': { status: 'supported', details: 'Supported' },
            'polygon': { status: 'supported', details: 'Supported' },
        }
    },
    {
        name: 'Token Swapping (Uniswap)',
        description: 'Perform cross-token swaps directly via Uniswap Routers.',
        support: {
            'robinhood-testnet': { status: 'unsupported', details: 'Not supported' },
            'robinhood-mainnet': { status: 'supported', details: 'Router v2.1.1' },
            'ethereum': { status: 'supported', details: 'Router v2.0' },
            'ethereum-sepolia': { status: 'partial', details: 'Low Liquidity' },
            'polygon': { status: 'supported', details: 'Router v2.0' },
        }
    }
]
