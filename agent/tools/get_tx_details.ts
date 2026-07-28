import { defineTool } from "eve/tools"
import { z } from "zod"
import { normalizeNetworkId, getNativeCurrencySymbol } from "../../lib/web3/config"
import { fetchTxDetails } from "../../lib/web3/txDetails"

export default defineTool({
    description:
        "Get detailed information for a specific transaction hash on the session active network. " +
        "Returns details including status, block number, confirmations, timestamp, sender (from), recipient (to), native value, gas fee, gas used, gas price, method, nonce, and token transfers if any. " +
        "CRITICAL: txHash must be a valid 66-character 0x... transaction hash. " +
        "CRITICAL presentation: On success, output ONLY a very brief one-sentence intro in the user's language that points to the transaction details UI card below. " +
        "Do NOT list out individual fields or summarize transaction details in your text - the frontend renders a custom transaction details card. " +
        "On failure, report the error in text.",
    inputSchema: z.object({
        txHash: z.string().describe("The 66-character 0x... transaction hash to check details for.")
    }),
    async execute({ txHash }, ctx) {
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )
        const symbol = getNativeCurrencySymbol(activeNetwork)

        try {
            const result = await fetchTxDetails(txHash, activeNetwork)
            if (!result.ok) {
                return {
                    success: false,
                    error: result.error,
                    network: result.networkId,
                    hash: txHash
                }
            }

            return {
                success: true,
                hash: result.tx.hash,
                network: result.networkId,
                symbol,
                tx: result.tx
            }
        } catch (error: any) {
            return {
                success: false,
                hash: txHash,
                error: error.message || "Failed to retrieve transaction details"
            }
        }
    }
})
