import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"

export default defineTool({
    description: "Get all wallets configured for the authenticated user. Useful to check if the user has any wallets, or to list them when they want to perform an action but haven't specified which wallet to use.",
    inputSchema: z.object({}),
    async execute({}, ctx) {
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
