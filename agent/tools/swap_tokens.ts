import { defineTool } from "eve/tools"
import { z } from "zod"
import { normalizeNetworkId } from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import {
    DEFAULT_SLIPPAGE,
    executeSwap,
    prepareSwapContext,
} from "../../lib/web3/swapCore"

export default defineTool({
    description:
        "Swap tokens on the active network via Uniswap (Trading API): native ETH/POL ↔ ERC-20 and ERC-20 ↔ ERC-20 when a route exists. " +
        "Pass token tickers/names or 0x addresses (e.g. tokenIn=ETH tokenOut=USDC amount=0.001). " +
        "Uses the chat UI active wallet unless fromAddressOrName is set. " +
        "May send an ERC-20 approval transaction first, then the swap. " +
        "Not available on Robinhood Testnet. " +
        "Whether you must confirm with the user before calling is controlled by the session TX confirmation policy " +
        "(always / agent_decides / never). Prefer get_swap_quote first when the policy requires confirmation.",
    inputSchema: z.object({
        tokenIn: z.string().describe(
            "Token to sell: native (ETH/POL), ticker/name (e.g. USDC), or contract address 0x…"
        ),
        tokenOut: z.string().describe(
            "Token to buy: native (ETH/POL), ticker/name (e.g. USDC), or contract address 0x…"
        ),
        amount: z.string().describe(
            "Exact human-readable amount of tokenIn to sell (e.g. '0.001' or '10.5')."
        ),
        slippageTolerance: z
            .number()
            .optional()
            .describe(
                `Slippage percent (default ${DEFAULT_SLIPPAGE}, max 5).`
            ),
        fromAddressOrName: z
            .string()
            .optional()
            .describe(
                "Optional user wallet override (address or name). Default: UI active wallet."
            ),
    }),
    async execute(
        { tokenIn, tokenOut, amount, slippageTolerance, fromAddressOrName },
        ctx
    ) {
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr =
            ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string"
                ? activeNetworkAttr
                : activeNetworkAttr?.[0]
        )

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session.",
            }
        }

        try {
            const walletResult = await resolveActingWallet(
                userId,
                ctx,
                fromAddressOrName
            )
            if (!walletResult.ok) {
                return { success: false, error: walletResult.error }
            }
            const wallet = walletResult.wallet

            const prepared = await prepareSwapContext({
                network: activeNetwork,
                walletAddress: wallet.address,
                encryptedKey: wallet.encryptedKey,
                tokenInQuery: tokenIn,
                tokenOutQuery: tokenOut,
                amount,
                slippageTolerance,
            })
            if (!prepared.ok) {
                return {
                    success: false,
                    error: prepared.error,
                    candidates: prepared.candidates,
                }
            }

            return await executeSwap(prepared.ctx)
        } catch (error: any) {
            return {
                success: false,
                error:
                    error?.message ||
                    "An error occurred while executing the Uniswap swap.",
            }
        }
    },
})
