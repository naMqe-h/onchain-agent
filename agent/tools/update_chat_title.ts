import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"

export default defineTool({
    description: "Update the title of the current chat conversation to a short, descriptive name (maximum 3-4 words) matching what the user provided in their initial query.",
    inputSchema: z.object({
        title: z.string().describe("The new short, descriptive title for the chat (maximum 3-4 words, in the same language as the user's prompt).")
    }),
    async execute({ title }, ctx) {
        const chatId = ctx.session?.auth?.current?.attributes?.chatId

        if (typeof chatId !== "string" || !chatId) {
            return {
                success: false,
                error: "No active chat ID could be identified from the session."
            }
        }

        try {
            await db.chat.update({
                where: { id: chatId },
                data: { title: title.trim() }
            })

            return {
                success: true,
                message: `Chat title successfully updated to: "${title}"`
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Failed to update chat title"
            }
        }
    }
})
