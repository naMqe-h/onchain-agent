import { defineTool } from "eve/tools"
import { z } from "zod"
import { formatUnits } from "viem"
import db from "../../lib/db"

export default defineTool({
    description: "Get the ERC-20 token balances of a specified address or wallet name from the Blockscout explorer API.",
    inputSchema: z.object({
        walletAddressOrName: z.string().optional().describe("The EVM blockchain address or the custom wallet name (e.g. 'Primary Wallet') to check token balances for. If omitted, the tool will try to use the user's only wallet or ask for clarification.")
    }),
    async execute({ walletAddressOrName }, ctx) {
        let targetAddress = walletAddressOrName?.trim()
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = (typeof activeNetworkAttr === 'string' ? activeNetworkAttr : activeNetworkAttr?.[0]) || "testnet"

        if (targetAddress) {
            if (!targetAddress.startsWith('0x') || targetAddress.length !== 42) {
                if (!userId || userId === "local-dev") {
                    return {
                        success: false,
                        error: "A wallet name was provided, but no authenticated database user could be identified from the session."
                    }
                }

                const wallet = await db.wallet.findFirst({
                    where: {
                        userId,
                        name: {
                            equals: targetAddress,
                            mode: 'insensitive'
                        }
                    }
                })

                if (!wallet) {
                    return {
                        success: false,
                        error: `No wallet named "${targetAddress}" was found for your account.`
                    }
                }

                targetAddress = wallet.address
            }
        } else {
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "No wallet address was specified, and no authenticated database user could be identified from the session."
                }
            }

            const wallets = await db.wallet.findMany({
                where: { userId }
            })

            if (wallets.length === 0) {
                return {
                    success: false,
                    error: "You don't have any wallets configured in the database, and you didn't specify a wallet address. Please provide a wallet address in your request."
                }
            }

            if (wallets.length > 1) {
                const walletList = wallets.map(w => `${w.name}: ${w.address.slice(0, 6)}...${w.address.slice(-4)}`).join("\n")
                return {
                    success: false,
                    error: `You have multiple wallets configured. Please specify which wallet to use by name or address:\n${walletList}`
                }
            }

            targetAddress = wallets[0].address
        }

        try {
            let url: string
            if (activeNetwork === "mainnet") {
                const apiBase = process.env.BLOCKSCOUT_API_URL_MAINNET
                const apiKey = process.env.BLOCKSCOUT_API_KEY_MAINNET
                url = `${apiBase}/addresses/${targetAddress}/token-balances`
                if (apiKey) {
                    url += `?apikey=${apiKey}`
                }
            } else {
                const apiBase = process.env.BLOCKSCOUT_API_URL_TESTNET
                const apiKey = process.env.BLOCKSCOUT_API_KEY_TESTNET
                url = `${apiBase}/addresses/${targetAddress}/token-balances`
                if (apiKey) {
                    url += `?apikey=${apiKey}`
                }
            }
            const response = await fetch(url)

            if (!response.ok) {
                return {
                    success: false,
                    error: `Failed to fetch token balances from explorer API (Status: ${response.status} ${response.statusText})`
                }
            }

            const data = await response.json()
            const rawItems = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : [])

            const tokens = rawItems
                .filter((item: any) => {
                    const type = item?.token?.type
                    return type === 'ERC-20'
                })
                .map((item: any) => {
                    const tokenInfo = item.token
                    const rawValue = item.value || '0'
                    const decimals = typeof tokenInfo.decimals === 'number'
                        ? tokenInfo.decimals
                        : parseInt(tokenInfo.decimals || '18', 10)

                    let formattedBalance = '0'
                    try {
                        formattedBalance = formatUnits(BigInt(rawValue), decimals)
                    } catch (e) {
                        formattedBalance = (Number(rawValue) / Math.pow(10, decimals)).toString()
                    }

                    return {
                        name: tokenInfo.name || 'Unknown Token',
                        symbol: tokenInfo.symbol || 'TOKEN',
                        address: tokenInfo.address,
                        balance: formattedBalance,
                        decimals
                    }
                })

            return {
                success: true,
                address: targetAddress,
                tokens
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve ERC-20 token balances"
            }
        }
    }
})
