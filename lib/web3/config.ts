import { defineChain } from "viem"

export const robinhoodTestnet = defineChain({
    id: 46630,
    name: "Robinhood Chain Testnet",
    network: "robinhood-testnet",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH"
    },
    rpcUrls: {
        default: {
            http: [process.env.ALCHEMY_RPC_URL_TESTNET || ""]
        }
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://explorer.testnet.chain.robinhood.com"
        }
    }
})

export const robinhoodMainnet = defineChain({
    id: 4663,
    name: "Robinhood Chain",
    network: "robinhood-mainnet",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH"
    },
    rpcUrls: {
        default: {
            http: [process.env.ALCHEMY_RPC_URL_MAINNET || ""]
        }
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://robinhoodchain.blockscout.com"
        }
    }
})

export function getChainConfig(network?: string) {
    return network === "mainnet" ? robinhoodMainnet : robinhoodTestnet
}
