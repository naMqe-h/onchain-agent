import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"

export default defineTool({
    description:
        "List all wallets configured for the authenticated user (name, address, type). " +
        "Use only when the user asks to list their wallets. " +
        "Do NOT use this to pick a default acting wallet - the chat UI wallet selector sets the active wallet for send/balance tools. " +
        "RESPONSE FORMATTING: When this tool succeeds, output only a very brief, concise, one-sentence introduction in the user's language pointing to the card below (e.g. 'Here are your configured wallets:'). Do NOT list, summarize, or enumerate individual wallets or addresses in your text response.",

    inputSchema: z.object({}),
    async execute({ }, ctx) {
        const userId = ctx.session?.auth?.current?.principalId

        if (!userId || userId === "local-dev") {
            return {
                success: false,
                error: "No authenticated database user could be identified from the session."
            }
        }

        try {
            const wallets = await db.wallet.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
                select: {
                    name: true,
                    address: true,
                    type: true
                }
            })

            return {
                success: true,
                wallets
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to retrieve user wallets"
            }
        }
    }
})
