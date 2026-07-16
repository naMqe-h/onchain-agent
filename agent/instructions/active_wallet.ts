import { defineDynamic, defineInstructions } from "eve/instructions"
import db from "../../lib/db"

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
            const address = attrString(ctx.session.auth.current?.attributes?.activeWalletAddress)
            if (!address) {
                return defineInstructions({
                    markdown:
                        `\n\n[ACTIVE WALLET THIS TURN]\n` +
                        `No active wallet for this turn (user has none configured or none selected). ` +
                        `You may still answer general questions and use tools that do not require the user's wallet (e.g. get_token_info, public address balance if they provide an address). ` +
                        `If they ask for their balance, send funds, or any action needing their wallet: call the tool as usual; if it fails, tell them to create/import a wallet in Settings → Wallets first, then select it under the chat input.\n`,
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
                    `\n\n[ACTIVE WALLET THIS TURN — BINDING]\n` +
                    `The user's active wallet for THIS turn is: \`${address}\`${nameHint}.\n` +
                    `This comes from the chat UI selector and is sent on every message — it may differ from earlier turns.\n` +
                    `- For "my wallet", "my balance", "check balance", "token balances" without a specific address: call get_balance / get_token_balances with NO wallet parameter. Do NOT ask which wallet. Do NOT confirm whether they mean the active wallet.\n` +
                    `- For send tools, omit fromAddressOrName unless the user explicitly named a different sender.\n` +
                    `- Ignore any older wallet addresses mentioned only in previous assistant messages if they conflict with the address above.\n`,
            })
        },
    },
})
