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
            http: [process.env.ALCHEMY_RPC_URL as string]
        }
    },
    blockExplorers: {
        default: {
            name: "Explorer",
            url: "https://explorer.testnet.chain.robinhood.com"
        }
    }
})
