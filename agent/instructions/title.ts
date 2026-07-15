import { defineDynamic, defineInstructions } from "eve/instructions"
import db from "../../lib/db"

export default defineDynamic({
    events: {
        "turn.started": async (event, ctx) => {
            const chatId = ctx.session.auth.current?.attributes?.chatId
            if (typeof chatId === "string" && chatId) {
                const chat = await db.chat.findUnique({
                    where: { id: chatId },
                    select: { title: true }
                })
                if (chat && chat.title === "New Chat") {
                    return defineInstructions({
                        markdown: `\n\n[SYSTEM MANDATORY RULE]\nThe current chat title is "New Chat". You MUST call the 'update_chat_title' tool in this turn (in parallel with any other tools you need to execute) to rename this chat to a short, descriptive name (max 3-4 words, in the same language as the user's query) based on the user's prompt. This is a mandatory system constraint. Do not answer the user without calling this tool.\n`
                    })
                }
            }
            return null
        }
    }
})
