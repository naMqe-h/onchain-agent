import { defineTool } from "eve/tools"
import { z } from "zod"
import { createPublicClient, http, formatEther } from "viem"
import { robinhoodTestnet } from "../../lib/web3/config"
import db from "../../lib/db"

export default defineTool({
    description: "Get the ETH balance of a specified address or the authenticated user's wallet.",
    inputSchema: z.object({
        address: z.string().optional().describe("The EVM blockchain address to check the balance of. If not provided, the authenticated user's wallet is used.")
    }),
    async execute({ address }, ctx) {
        let targetAddress = address

        if (!targetAddress) {
            const userId = ctx.session?.auth?.current?.principalId
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "No address was provided, and no authenticated database user could be identified from the session."
                }
            }

            const wallet = await db.wallet.findFirst({
                where: { userId }
            })

            if (!wallet) {
                return {
                    success: false,
                    error: `No wallet found for user ID: ${userId}`
                }
            }

            targetAddress = wallet.address
        }

        try {
            const publicClient = createPublicClient({
                chain: robinhoodTestnet,
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
