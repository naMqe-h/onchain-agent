import { defineDynamic, defineInstructions } from "eve/instructions"
import db from "../../lib/db"
import {
    getNativeCurrencySymbol,
    getNetworkLabel,
    normalizeNetworkId,
} from "../../lib/web3/config"

function attrString(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0].trim()
    }
    return null
}

export default defineDynamic({
    events: {
        "turn.started": async (_event, ctx) => {
            const networkId = normalizeNetworkId(
                attrString(ctx.session.auth.current?.attributes?.activeNetwork)
            )
            const networkLabel = getNetworkLabel(networkId)
            const nativeSymbol = getNativeCurrencySymbol(networkId)
            const networkBlock =
                `\n\n[ACTIVE NETWORK THIS TURN]\n` +
                `Active network: **${networkLabel}** (\`${networkId}\`), Native: **${nativeSymbol}**.\n` +
                `- Always re-query on-chain tools each turn for **${networkLabel}** (data is network-specific).\n`

            const address = attrString(ctx.session.auth.current?.attributes?.activeWalletAddress)
            if (!address) {
                return defineInstructions({
                    markdown:
                        networkBlock +
                        `\n[ACTIVE WALLET THIS TURN]\n` +
                        `No active wallet configured/selected. Answer general queries or use tools taking explicit addresses.\n`,
                })
            }

            const userId = ctx.session.auth.current?.principalId
            let nameHint = ""
            if (userId && userId !== "local-dev") {
                try {
                    const wallet = await db.wallet.findFirst({
                        where: {
                            userId,
                            address: { equals: address, mode: "insensitive" },
                        },
                        select: { name: true, address: true },
                    })
                    if (wallet) {
                        nameHint = ` ("${wallet.name}")`
                    }
                } catch { }
            }

            return defineInstructions({
                markdown:
                    networkBlock +
                    `\n[ACTIVE WALLET THIS TURN]\n` +
                    `UI Default: \`${address}\`${nameHint}.\n` +
                    `- Explicit 0x address or wallet/contact name in user prompt MUST override UI default (pass into \`address\` / \`walletAddressOrName\` parameters).\n` +
                    `- If prompt has no address/name, call tools without address parameter to use UI default. Do NOT ask which wallet.\n`,
            })
        },
    },
})
