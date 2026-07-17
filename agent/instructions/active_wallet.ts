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
                `\n\n[ACTIVE NETWORK THIS TURN — BINDING]\n` +
                `Active network for THIS turn only: **${networkLabel}** (\`${networkId}\`). Native currency: **${nativeSymbol}**.\n` +
                `This value is re-injected every turn from the UI and **may change mid-conversation** without the user saying so in the message.\n` +
                `\n` +
                `### On-chain data is per-network (CRITICAL)\n` +
                `- Balances, ERC-20 lists, token info, and txs on one network are **not valid** on another (e.g. Ethereum ≠ Polygon ≠ Robinhood).\n` +
                `- For **any** on-chain request this turn (balance, token balances, token info, send), you MUST call the relevant tool(s) again using the active network above.\n` +
                `- Do **not** skip tools because chat history already has a similar answer for the same address — those results may be from a **different network** or an older turn.\n` +
                `- Do **not** reply with "I already checked that" / "as above" for on-chain queries; re-query and answer with data for **${networkLabel}** (\`${networkId}\`) only.\n` +
                `- When summarizing, state which network the data is from (use the tool's \`network\` field when present).\n`

            const address = attrString(ctx.session.auth.current?.attributes?.activeWalletAddress)
            if (!address) {
                return defineInstructions({
                    markdown:
                        networkBlock +
                        `\n\n[ACTIVE WALLET THIS TURN]\n` +
                        `No active wallet for this turn (user has none configured or none selected). ` +
                        `You may still answer general questions and use tools that do not require the user's wallet (e.g. get_token_info, public address balance if they provide an address). ` +
                        `If the user provides a 0x address or wallet name in the message for balance/token checks, you MUST pass it to get_balance (address) / get_token_balances (walletAddressOrName). ` +
                        `If they ask for their balance, send funds, or any action needing their wallet without an address: call the tool as usual; if it fails, tell them to create/import a wallet in Settings → Wallets first, then select it under the chat input.\n`,
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
                        nameHint = ` (name: "${wallet.name}")`
                    }
                } catch { }
            }

            return defineInstructions({
                markdown:
                    networkBlock +
                    `\n\n[ACTIVE WALLET THIS TURN — BINDING]\n` +
                    `The user's **UI default** wallet for THIS turn is: \`${address}\`${nameHint}.\n` +
                    `This is the chat UI selector default only — it is NOT a override of addresses the user types in the message.\n` +
                    `\n` +
                    `### Explicit address / wallet name in the user message (HIGHEST PRIORITY)\n` +
                    `- If the user's message contains a **0x… EVM address** (42 chars) or a **wallet name** they want checked/queried (e.g. "check tokens for 0xabc…", "balance of secondary", "token balances at 0x…"), you MUST pass that value into the tool:\n` +
                    `  - \`get_balance\` → parameter \`address\`\n` +
                    `  - \`get_token_balances\` → parameter \`walletAddressOrName\`\n` +
                    `- **NEVER** omit the parameter and fall back to the UI active wallet when the user already gave a different address or wallet name in **this** message.\n` +
                    `- Copy the address exactly as the user wrote it (do not replace it with \`${address}\`).\n` +
                    `\n` +
                    `### Only when NO address / wallet name is in the message\n` +
                    `- Phrases like "my wallet", "my balance", "check balance", "token balances" with **no** 0x address and **no** wallet name → call get_balance / get_token_balances with **no** wallet parameter (UI default). Do NOT ask which wallet.\n` +
                    `- For send tools, omit fromAddressOrName unless the user explicitly named a different sender.\n` +
                    `- Ignore wallet addresses that appear only in **previous assistant** messages if they conflict with the UI default — but **never** ignore a 0x address or wallet name from the **current user** message.\n`,
            })
        },
    },
})
