import { defineTool } from "eve/tools"
import { z } from "zod"
import db from "../../lib/db"

export default defineTool({
    description:
        "Agent TOOL (not a skill): update the current chat title to a short name (max 3-4 words) based on the user's prompt. " +
        "Call this tool directly with { title }. Never use load_skill for this — there is no skill named update_chat_title.",
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
