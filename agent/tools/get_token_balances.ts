import { defineTool } from "eve/tools"
import { z } from "zod"
import { resolveActingWallet } from "../../lib/web3/resolveActiveWallet"
import { resolveNamedAddress } from "../../lib/web3/resolveNamedAddress"
import { normalizeNetworkId } from "../../lib/web3/config"
import {
    ERC20_BALANCES_TOP_LIMIT,
    fetchWalletErc20Tokens,
} from "../../lib/web3/tokenBalances"

export default defineTool({
    description:
        "Get ERC-20 token balances for a wallet on active network. " +
        "Output ONLY a brief 1-sentence intro pointing to the rendered UI table - do NOT list tokens in text. " +
        "Pass walletAddressOrName if user specified a 0x address, wallet name, or contact name.",
    inputSchema: z.object({
        walletAddressOrName: z.string().optional().describe("Optional 0x address, wallet name, or contact name."),
    }),
    async execute({ walletAddressOrName }, ctx) {
        const input = walletAddressOrName?.trim()
        const userId = ctx.session?.auth?.current?.principalId
        const activeNetworkAttr = ctx.session?.auth?.current?.attributes?.activeNetwork
        const activeNetwork = normalizeNetworkId(
            typeof activeNetworkAttr === "string" ? activeNetworkAttr : activeNetworkAttr?.[0]
        )

        let targetAddress: string

        if (!input) {
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
        } else {
            if (!userId || userId === "local-dev") {
                const looksLikeAddress = input.startsWith("0x") && input.length === 42
                if (!looksLikeAddress) {
                    return {
                        success: false,
                        error: "A name was provided, but no authenticated user could be identified from the session.",
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
                    circulatingMarketCap: t.circulatingMarketCap,
                    volume24h: t.volume24h,
                    iconUrl: t.iconUrl,
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
