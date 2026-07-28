import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"

export default defineTool({
    description:
        "List all private address book entries for the authenticated user (name and public address only). " +
        "Use when the user asks to list their address book, contacts, or saved named addresses. " +
        "Do NOT use this to pick a default acting wallet - only user wallets can send transactions. " +
        "Address book names can be passed to get_balance, get_token_balances, send_native (recipient), and send_erc20 (recipient). " +
        "RESPONSE FORMATTING: When this tool succeeds, output only a very brief, concise, one-sentence introduction in the user's language pointing to the card below (e.g. 'Here is your address book:'). Do NOT list, summarize, or enumerate individual contacts or addresses in your text response.",

    inputSchema: z.object({}),
    async execute({ }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session.",
            }
        }

        try {
            const entries = await db.addressBookEntry.findMany({
                where: { userId },
                orderBy: { createdAt: "asc" },
                select: {
                    name: true,
                    address: true,
                },
            })

            return {
                success: true,
                entries,
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve address book",
            }
        }
    },
})
