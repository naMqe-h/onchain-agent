import { defineTool } from "eve/tools"
import { z } from "zod"
import { formatEther } from "viem"
import { getPublicClient } from "../../../lib/web3/providers"
import {
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../../lib/web3/config"
import { resolveActingWallet } from "../../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../../lib/web3/resolveNamedAddress"

export default defineTool({
    description:
        "Get native currency balance (ETH/POL) on active network. " +
        "Pass address parameter if user specified a 0x address, wallet name, or contact name.",
    inputSchema: z.object({
        address: z.string().optional().describe("Optional 0x address, wallet name, or contact name."),
    }),
    async execute({ address }, ctx) {
        const input = address?.trim()
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )
        const symbol = getNativeCurrencySymbol(activeNetwork)

        let targetAddress: string

        if (!input) {
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "No address was specified, and no authenticated database user could be identified from the session.",
                }
            }
            const resolved = await resolveActingWallet(userId, ctx)
            if (!resolved.ok) {
                return { success: false, error: resolved.error }
            }
            targetAddress = resolved.wallet.address
        } else {
            if (!userId || userId === "local-dev") {
                const looksLikeAddress = input.startsWith("0x") && input.length === 42
                if (!looksLikeAddress) {
                    return {
                        success: false,
                        error: "A name was provided, but no authenticated database user could be identified from the session.",
                    }
                }
            }

            if (userId && userId !== "local-dev") {
                const resolved = await resolveNamedAddress(userId, input)
                if (!resolved.ok) {
                    return { success: false, error: resolved.error }
                }
                targetAddress = resolved.address
            } else {
                targetAddress = input
            }
        }

        try {
            const publicClient = getPublicClient(activeNetwork)

            const balance = await publicClient.getBalance({
                address: targetAddress as `0x${string}`,
            })

            const balanceFormatted = formatEther(balance)

            return {
                success: true,
                address: targetAddress,
                balance: balanceFormatted,
                symbol,
                network: activeNetwork,
                formatted: `${balanceFormatted} ${symbol}`,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve balance",
            }
        }
    },
})
