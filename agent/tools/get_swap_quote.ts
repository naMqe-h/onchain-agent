import { defineTool } from "eve/tools"
import { z } from "zod"
import {
    getNativeCurrencySymbol,
    getNetworkLabel,
    normalizeNetworkId,
} from "../../lib/web3/config"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import {
    assertSufficientBalance,
    DEFAULT_SLIPPAGE,
    fetchSwapQuote,
    prepareSwapContext,
} from "../../lib/web3/swapCore"

export default defineTool({
    description:
        "Get a Uniswap quote for swapping tokens on the active network without sending a transaction. " +
        "Supports native ETH/POL and ERC-20; tokens may be tickers/names or 0x addresses (e.g. ETH, USDC). " +
        "Use before swap_tokens when the TX confirmation policy requires confirmation, or when the user only asks how much they would receive. " +
        "Not available on Robinhood Testnet. Supported: Ethereum, Ethereum Sepolia, Polygon, Robinhood Mainnet.",
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

            const balanceCheck = await assertSufficientBalance(prepared.ctx)
            if (!balanceCheck.ok) {
                return { success: false, error: balanceCheck.error }
            }

            const { summary } = await fetchSwapQuote(prepared.ctx)
            const c = prepared.ctx

            return {
                success: true,
                network: activeNetwork,
                networkLabel: getNetworkLabel(activeNetwork),
                nativeSymbol: getNativeCurrencySymbol(activeNetwork),
                from: wallet.address,
                tokenIn: {
                    address: c.tokenIn.address,
                    symbol: c.tokenIn.symbol,
                    name: c.tokenIn.name,
                    decimals: c.tokenIn.decimals,
                    isNative: c.tokenIn.isNative,
                    source: c.tokenIn.source,
                },
                tokenOut: {
                    address: c.tokenOut.address,
                    symbol: c.tokenOut.symbol,
                    name: c.tokenOut.name,
                    decimals: c.tokenOut.decimals,
                    isNative: c.tokenOut.isNative,
                    source: c.tokenOut.source,
                },
                amountIn: summary.amountIn,
                amountInRaw: summary.amountInRaw,
                amountOut: summary.amountOut,
                amountOutRaw: summary.amountOutRaw,
                slippageTolerance: summary.slippageTolerance,
                routing: summary.routing,
                gasFeeUSD: summary.gasFeeUSD,
                gasUseEstimate: summary.gasUseEstimate,
            }
        } catch (error: any) {
            return {
                success: false,
                error:
                    error?.message ||
                    "Failed to get Uniswap swap quote.",
            }
        }
    },
})
