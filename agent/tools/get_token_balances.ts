import { defineTool } from "eve/tools"
import { z } from "zod"
import { formatUnits } from "viem"
import db from "../../lib/db"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"

export default defineTool({
    description:
        "Get ERC-20 token balances for a wallet. " +
        "Returns each token's name, symbol, contract address, balance, and decimals. " +
        "If wallet is omitted, uses the active wallet from the chat UI selector. " +
        "For 'my tokens' / 'token balances' without a specific address, omit walletAddressOrName — do not ask which wallet. " +
        "For transfers by ticker/name, prefer send_erc20 which resolves the contract from sender balances automatically.",
    inputSchema: z.object({
        walletAddressOrName: z.string().optional().describe(
            "EVM address or custom wallet name. Omit entirely to use the chat UI active wallet (preferred for 'my tokens' / token balances)."
        )
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

            const resolved = await resolveActingWallet(userId, ctx)
            if (!resolved.ok) {
                return { success: false, error: resolved.error }
            }
            targetAddress = resolved.wallet.address
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
                        address: tokenInfo.address_hash || tokenInfo.address,
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
