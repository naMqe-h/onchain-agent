import { defineTool } from "eve/tools"
import { z } from "zod"
import { createPublicClient, http, formatEther } from "viem"
import { robinhoodTestnet } from "../../lib/web3/config"
import db from "../../lib/db"

export default defineTool({
    description: "Get the ETH balance of a specified address or wallet name.",
    inputSchema: z.object({
        address: z.string().describe("The EVM blockchain address or the custom wallet name (e.g. 'Primary Wallet') to check the balance of.")
    }),
    async execute({ address }, ctx) {
        let targetAddress = address
        const userId = ctx.session?.auth?.current?.principalId

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
                        equals: targetAddress.trim(),
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
