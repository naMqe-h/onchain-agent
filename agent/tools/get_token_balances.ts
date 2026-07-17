import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import { normalizeNetworkId } from "../../lib/web3/config"
import {
    ERC20_BALANCES_TOP_LIMIT,
    fetchWalletErc20Tokens,
} from "../../lib/web3/tokenBalances"

export default defineTool({
    description:
        "Get ERC-20 token balances for a wallet on the session active network. " +
        `Returns at most the top ${ERC20_BALANCES_TOP_LIMIT} tokens by approximate USD value (balance * price), not by token amount. ` +
        "Each token includes name, symbol, contract address, balance, decimals, and valueUsd. " +
        "If the wallet holds more tokens, totalCount / truncated / note explain that only the most valuable ones were returned. " +
        "CRITICAL: If the user message includes a 0x address or a wallet name to check, you MUST pass it as walletAddressOrName — never omit it in that case (omitting queries the UI active wallet instead). " +
        "Only omit walletAddressOrName for 'my tokens' / 'my balances' with no address/name in the message. " +
        "When presenting results to the user, list EVERY token in the returned tokens array — do not omit or summarize a subset. " +
        "Always call this tool again when the user asks for token balances, even if you answered earlier — the active network may have changed mid-chat. " +
        "For transfers by ticker/name, prefer send_erc20 which resolves the contract from sender balances automatically.",
    inputSchema: z.object({
        walletAddressOrName: z.string().optional().describe(
            "REQUIRED when the user named a specific EVM address (0x…) or wallet name to inspect. " +
            "Pass that value exactly. Only omit for 'my tokens' / generic own-balance checks so the chat UI active wallet is used."
        ),
    }),
    async execute({ walletAddressOrName }, ctx) {
        let targetAddress = walletAddressOrName?.trim()
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )

        if (targetAddress) {
            if (!targetAddress.startsWith("0x") || targetAddress.length !== 42) {
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
                            equals: targetAddress,
                            mode: "insensitive",
                        },
                    },
                })

                if (!wallet) {
                    return {
                        success: false,
                        error: `No wallet named "${targetAddress}" was found for your account.`,
                    }
                }

                targetAddress = wallet.address
            }
        } else {
            if (!userId || userId === "local-dev") {
                return {
                    success: false,
                    error: "No wallet address was specified, and no authenticated database user could be identified from the session.",
                }
            }

            const resolved = await resolveActingWallet(userId, ctx)
            if (!resolved.ok) {
                return { success: false, error: resolved.error }
            }
            targetAddress = resolved.wallet.address
        }

        try {
            const result = await fetchWalletErc20Tokens(targetAddress, activeNetwork, {
                limit: ERC20_BALANCES_TOP_LIMIT,
            })
            if (!result.ok) {
                return { success: false, error: result.error, network: result.networkId }
            }

            const note = result.truncated
                ? `This address holds ${result.totalCount} ERC-20 tokens. Only the top ${ERC20_BALANCES_TOP_LIMIT} by approximate USD value (balance * price) are returned.`
                : undefined

            return {
                success: true,
                address: targetAddress,
                network: result.networkId,
                totalCount: result.totalCount,
                returnedCount: result.tokens.length,
                truncated: result.truncated,
                ...(note ? { note } : {}),
                tokens: result.tokens.map((t) => ({
                    name: t.name,
                    symbol: t.symbol,
                    address: t.address,
                    balance: t.balance,
                    decimals: t.decimals,
                    valueUsd: t.valueUsd,
                })),
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve ERC-20 token balances",
            }
        }
    },
})
