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
    const scope = `Applies ONLY to write tools (\`send_native\`, \`send_erc20\`, \`swap_tokens\`). Read tools do NOT require confirmation.\n`

    if (mode === "always") {
        return (
            scope +
            `Mode: **ALWAYS ASK**. Get explicit user confirmation of parameters (amount, asset, recipient/tokens) in chat before calling write tools, unless prompt explicitly specifies immediate execution.\n`
        )
    }

    if (mode === "agent_decides") {
        return (
            scope +
            `Mode: **AGENT DECIDES**. Ask for confirmation if amount is large/risky or parameters are ambiguous; execute directly if amount is small and intent is clear.\n`
        )
    }

    return (
        scope +
        `Mode: **NEVER ASK**. Execute write tools immediately when parameters are complete without asking for confirmation.\n`
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
                    `\n[TX CONFIRMATION POLICY THIS TURN]\n` +
                    policyBody(mode),
            })
        },
    },
})
