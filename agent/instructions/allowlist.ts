import { defineDynamic, defineInstructions } from "eve/instructions"

export default defineDynamic({
    events: {
        "turn.started": async (_event, ctx) => {
            const enabled = ctx.session.auth.current?.attributes?.addressAllowlistEnabled === "true"

            if (enabled) {
                return defineInstructions({
                    markdown:
                        `\n\n[ADDRESS ALLOWLIST POLICY THIS TURN - BINDING]\n` +
                        `Status: **enabled**.\n` +
                        `You are ONLY allowed to send native or ERC-20 tokens to recipient addresses that are in the user's Address Book or Wallets.\n` +
                        `Before executing any transfer using \`send_native\` or \`send_erc20\`, check if the destination address or contact name is in the user's Address Book or Wallets list.\n` +
                        `If the destination address/contact is NOT in the user's Address Book or Wallets, do NOT call \`send_native\` or \`send_erc20\`. Instead, refuse the transaction immediately and inform the user that the Address Allowlist security check is active and blocking this transaction, and that they must add the recipient to their Address Book in Settings or disable the safety check in Settings -> Security to proceed.\n`,
                })
            }

            return defineInstructions({
                markdown:
                    `\n\n[ADDRESS ALLOWLIST POLICY THIS TURN - BINDING]\n` +
                    `Status: **disabled**.\n` +
                    `You may send native or ERC-20 tokens to any destination address as requested by the user, without restriction.\n`,
            })
        },
    },
})
