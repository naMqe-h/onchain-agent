import { defineTool } from "eve/tools"
import { z } from "zod"
import { createPublicClient, http, formatEther } from "viem"
import {
    getChainConfig,
    getNativeCurrencySymbol,
    normalizeNetworkId,
} from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import db from "../../lib/db"

export default defineTool({
    description:
        "Get the native currency balance (ETH on Robinhood/Ethereum, POL on Polygon) of an address, a wallet name, " +
        "or (if omitted) the user's active wallet from the chat UI selector. Uses the session active network. " +
        "CRITICAL: If the user message includes a 0x address or a wallet name to check, you MUST pass it as address — never omit it in that case. " +
        "Only omit address for 'my wallet' / 'my balance' / generic own-balance checks with no address/name in the message. " +
        "Always call this tool again when the user asks for a balance — do not reuse an earlier answer; the active network may have changed mid-chat.",
    inputSchema: z.object({
        address: z.string().optional().describe(
            "REQUIRED when the user named a specific EVM address (0x…) or wallet name to inspect. " +
            "Pass that value exactly. Only omit for 'my wallet' / generic own-balance checks so the chat UI active wallet is used."
        ),
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
        } else if (!input.startsWith("0x") || input.length !== 42) {
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "A wallet name was provided, but no authenticated database user could be identified from the session.",
                }
            }

            const wallet = await db.wallet.findFirst({
                where: {
                    userId,
                    name: {
                        equals: input,
                        mode: "insensitive",
                    },
                },
            })

            if (!wallet) {
                return {
                    success: false,
                    error: `No wallet named "${input}" was found for your account.`,
                }
            }

            targetAddress = wallet.address
        } else {
            targetAddress = input
        }

        try {
            const chain = getChainConfig(activeNetwork)
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            })

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
