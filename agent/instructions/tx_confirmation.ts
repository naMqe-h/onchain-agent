import { defineDynamic, defineInstructions } from "eve/instructions"
import { normalizeTxConfirmationMode, type TxConfirmationMode } from "../../lib/security"

function attrString(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0].trim()
    }
    return null
}

function policyBody(mode: TxConfirmationMode): string {
    const scope =
        `Applies ONLY to tools that create on-chain transactions: \`send_native\`, \`send_erc20\`.\n` +
        `Does NOT apply to read-only tools: \`get_balance\`, \`get_token_balances\`, \`get_token_info\`, ` +
        `\`get_user_wallets\`, \`get_address_book\`, \`update_chat_title\`.\n`

    if (mode === "always") {
        return (
            scope +
            `\n` +
            `### Mode: ALWAYS ASK (default / strict)\n` +
            `- Before EVERY call to \`send_native\` or \`send_erc20\`, you MUST get the user's explicit confirmation of the transfer details in this conversation.\n` +
            `- Confirm: amount + asset (native symbol or token ticker/name), recipient (as named or address), active network name, and sender (UI active wallet unless they named another wallet).\n` +
            `- Do NOT call a send tool in the same turn where you first propose the details - first reply with the summary and ask to confirm; after they say yes / confirm / send (or equivalent), call the tool.\n` +
            `- Exception: if the **same user message** that contains the full transfer request also contains an unambiguous go-ahead (e.g. "confirm and send now", "yes send it immediately"), you may call the send tool in that turn without a further round-trip.\n` +
            `- Never invent addresses, amounts, or tokens. Still resolve native vs ERC-20 using the existing tool-selection rules.\n`
        )
    }

    if (mode === "agent_decides") {
        return (
            scope +
            `\n` +
            `### Mode: AGENT DECIDES\n` +
            `- You may either ask for confirmation or call \`send_native\` / \`send_erc20\` directly once parameters are complete.\n` +
            `- Prefer asking when: amount is large or unusual, recipient is a raw unknown \`0x\` not clearly from wallets/address book, parameters are ambiguous, or the user seems unaware of risk.\n` +
            `- You may skip confirmation when: amount is small, recipient is a known wallet or address-book name, all parameters are explicit in the prompt, and the user clearly wants the transfer executed.\n` +
            `- If you skip confirmation, briefly note in text that you are sending under the "agent decides" preference, then call the tool.\n` +
            `- If you ask, wait for explicit confirmation before calling the send tool (same multi-turn rule as always-ask).\n` +
            `- Still ask clarifying questions for missing parameters (amount, recipient, native vs token) - that is not "confirmation", it is gathering details.\n`
        )
    }

    return (
        scope +
        `\n` +
        `### Mode: NEVER ASK (YOLO)\n` +
        `- Do NOT ask the user to confirm transfer details before calling \`send_native\` or \`send_erc20\`.\n` +
        `- When parameters are complete and unambiguous, call the send tool in this turn.\n` +
        `- If parameters are missing (amount, recipient, or native vs ERC-20), ask ONLY for the missing data - do not ask "do you confirm this transfer?".\n` +
        `- Never invent addresses, amounts, or tokens. Still follow send_native vs send_erc20 selection rules and name resolution.\n` +
        `- After a successful send, keep the same brief success intro (no detail dump); the UI renders the card.\n`
    )
}

export default defineDynamic({
    events: {
        "turn.started": async (_event, ctx) => {
            const mode = normalizeTxConfirmationMode(
                attrString(ctx.session.auth.current?.attributes?.txConfirmationMode)
            )

            return defineInstructions({
                markdown:
                    `\n\n[TX CONFIRMATION POLICY THIS TURN - BINDING]\n` +
                    `Mode for THIS turn: **${mode}**.\n` +
                    `This value is re-injected every turn from Settings → Security and may change mid-conversation without the user saying so.\n` +
                    `Obey this block for send tools. It overrides any generic habit to always (or never) confirm.\n` +
                    `\n` +
                    policyBody(mode),
            })
        },
    },
})
