import { defineDynamic, defineInstructions } from "eve/instructions"
import { normalizeTxConfirmationMode } from "../../lib/security"
import { TxConfirmationMode } from "@/types"

function attrString(value: unknown): string | null {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return value[0].trim()
    }
    return null
}

function policyBody(mode: TxConfirmationMode): string {
    const scope =
        `Applies ONLY to tools that create on-chain transactions: \`send_native\`, \`send_erc20\`, \`swap_tokens\`.\n` +
        `Does NOT apply to read-only tools: \`get_balance\`, \`get_token_balances\`, \`get_token_info\`, ` +
        `\`get_user_wallets\`, \`get_address_book\`, \`update_chat_title\`, \`get_swap_quote\`, \`get_tx_history\`, \`get_tx_details\`.\n`

    if (mode === "always") {
        return (
            scope +
            `\n` +
            `### Mode: ALWAYS ASK (default / strict)\n` +
            `- Before EVERY call to \`send_native\`, \`send_erc20\`, or \`swap_tokens\`, you MUST get the user's explicit confirmation of the details in this conversation.\n` +
            `- For sends: confirm amount + asset (native symbol or token ticker/name), recipient, active network name, and sender.\n` +
            `- For swaps: prefer calling \`get_swap_quote\` first, then confirm amountIn + tokenIn, expected amountOut + tokenOut, slippage, active network, and wallet. After the user confirms, call \`swap_tokens\` with the same parameters.\n` +
            `- Do NOT call a write tool in the same turn where you first propose the details - first reply with the summary and ask to confirm; after they say yes / confirm / send (or equivalent), call the tool.\n` +
            `- Exception: if the **same user message** that contains the full request also contains an unambiguous go-ahead (e.g. "confirm and swap now"), you may call the write tool in that turn without a further round-trip.\n` +
            `- Never invent addresses, amounts, or tokens. Still resolve native vs ERC-20 vs swap using the existing tool-selection rules.\n`
        )
    }

    if (mode === "agent_decides") {
        return (
            scope +
            `\n` +
            `### Mode: AGENT DECIDES\n` +
            `- You may either ask for confirmation or call \`send_native\` / \`send_erc20\` / \`swap_tokens\` directly once parameters are complete.\n` +
            `- Prefer asking when: amount is large or unusual, swap involves unfamiliar tokens, parameters are ambiguous, or the user seems unaware of risk.\n` +
            `- You may skip confirmation when: amount is small, all parameters are explicit, and the user clearly wants execution.\n` +
            `- If you skip confirmation, briefly note in text that you are executing under the "agent decides" preference, then call the tool.\n` +
            `- If you ask, wait for explicit confirmation before calling the write tool (same multi-turn rule as always-ask).\n` +
            `- Still ask clarifying questions for missing parameters - that is not "confirmation", it is gathering details.\n`
        )
    }

    return (
        scope +
        `\n` +
        `### Mode: NEVER ASK (YOLO)\n` +
        `- Do NOT ask the user to confirm details before calling \`send_native\`, \`send_erc20\`, or \`swap_tokens\`.\n` +
        `- When parameters are complete and unambiguous, call the write tool in this turn.\n` +
        `- If parameters are missing, ask ONLY for the missing data - do not ask "do you confirm?".\n` +
        `- Never invent addresses, amounts, or tokens. Still follow send vs swap selection rules.\n` +
        `- After a successful write, keep the same brief success intro (no detail dump); the UI renders the card.\n`
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
                    `Obey this block for send and swap tools. It overrides any generic habit to always (or never) confirm.\n` +
                    `\n` +
                    policyBody(mode),
            })
        },
    },
})
