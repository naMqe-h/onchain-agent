import { defineTool } from "eve/tools"
import { z } from "zod"
import { resolveActingWallet } from "../../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../../lib/web3/resolveNamedAddress"
import { normalizeNetworkId, getNativeCurrencySymbol } from "../../../lib/web3/config"
import { fetchWalletTxHistory } from "../../../lib/web3/txHistory"

export default defineTool({
    description:
        "Get transaction history for a wallet on the session active network. " +
        "Returns the recent transactions including hash, timestamp, status, sender (from), recipient (to), native value, transaction fee, and decoded method (like transfer, swap, or null). " +
        "CRITICAL: If the user message includes a 0x address, a wallet name, or an address book name to check, you MUST pass it as walletAddressOrName - never omit it in that case (omitting queries the UI active wallet instead). " +
        "Only omit walletAddressOrName for 'my transactions' / 'my history' with no address/name in the message. " +
        "CRITICAL presentation: On success with a non-empty transactions array, output ONLY a very brief one-sentence intro in the user's language that points to the transaction history UI card below" +
        "Do NOT list, list-out, or summarize individual transactions in your text - the frontend renders a custom transaction history card. " +
        "On success with an empty transactions array, tell the user clearly that this wallet has no transactions on the active network (include address and network). " +
        "On failure, report the error in text. " +
        "Always call this tool again when the user asks for transaction history, even if you answered earlier - the active network may have changed mid-chat.",
    inputSchema: z.object({
        walletAddressOrName: z.string().optional().describe(
            "REQUIRED when the user named a specific EVM address (0x…), wallet name, or address book entry name to inspect. " +
            "Pass that value exactly. Only omit for 'my transactions' / generic own-history checks so the chat UI active wallet is used."
        ),
        limit: z.number().optional().describe("Number of recent transactions to return. Defaults to 10. Max is 50.")
    }),
    async execute({ walletAddressOrName, limit }, ctx) {
        const input = walletAddressOrName?.trim()
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
                    error: "No wallet address was specified, and no authenticated database user could be identified from the session."
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
                        error: "A name was provided, but no authenticated user could be identified from the session."
                    }
                }
                targetAddress = input
            } else {
                const resolved = await resolveNamedAddress(userId, input)
                if (!resolved.ok) {
                    return { success: false, error: resolved.error }
                }
                targetAddress = resolved.address
            }
        }

        try {
            const fetchLimit = limit && limit > 0 && limit <= 50 ? limit : 10
            const result = await fetchWalletTxHistory(targetAddress, activeNetwork, {
                limit: fetchLimit
            })
            if (!result.ok) {
                return { success: false, error: result.error, network: result.networkId }
            }

            return {
                success: true,
                address: targetAddress,
                network: result.networkId,
                symbol,
                totalCount: result.totalCount,
                returnedCount: result.transactions.length,
                transactions: result.transactions.map((tx) => ({
                    hash: tx.hash,
                    timestamp: tx.timestamp,
                    status: tx.status,
                    from: tx.from,
                    to: tx.to,
                    value: tx.value,
                    fee: tx.fee,
                    method: tx.method
                }))
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve transaction history"
            }
        }
    }
})
