import { defineTool } from "eve/tools"
import { z } from "zod"
import { createPublicClient, http, formatEther } from "viem"
import { getChainConfig } from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import db from "../../lib/db"

export default defineTool({
    description:
        "Get the ETH balance of an address, a wallet name, or (if omitted) the user's active wallet from the chat UI selector. " +
        "For 'my wallet' / 'my balance' / generic balance checks, omit address — do not ask the user which wallet.",
    inputSchema: z.object({
        address: z.string().optional().describe(
            "EVM address or custom wallet name to check. Omit entirely to use the chat UI active wallet (preferred for 'my wallet' / balance checks)."
        )
    }),
    async execute({ address }, ctx) {
        let targetAddress = address?.trim()
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = (typeof activeNetworkAttr === 'string' ? activeNetworkAttr : activeNetworkAttr?.[0]) || "testnet"

        if (!targetAddress) {
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "No address was specified, and no authenticated database user could be identified from the session."
                }
            }
            const resolved = await resolveActingWallet(userId, ctx)
            if (!resolved.ok) {
                return { success: false, error: resolved.error }
            }
            targetAddress = resolved.wallet.address
        } else if (!targetAddress.startsWith('0x') || targetAddress.length !== 42) {
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

        try {
            const chain = getChainConfig(activeNetwork)
            const publicClient = createPublicClient({
                chain,
                transport: http()
            })

            const balance = await publicClient.getBalance({
                address: targetAddress as `0x${string}`
            })

            const balanceEth = formatEther(balance)

            return {
                success: true,
                address: targetAddress,
                balance: balanceEth,
                formatted: `${balanceEth} ETH`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve balance"
            }
        }
    }
})
