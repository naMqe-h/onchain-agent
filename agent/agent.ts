import { defineAgent, defineDynamic } from "eve"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createOpenAI } from "@ai-sdk/openai"
import db from "../lib/db"

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const defaultModel = openai("gpt-4.1-nano")

const MODELS: Record<string, any> = {
  "cohere/north-mini-code:free": openrouter("cohere/north-mini-code:free"),
  "gpt-4.1-nano": defaultModel,
}

export default defineAgent({
  model: defineDynamic({
    fallback: defaultModel,
    events: {
      "step.started": async (event, ctx) => {
        const headerModel = ctx.session.auth.current?.attributes?.modelName
        if (typeof headerModel === "string" && MODELS[headerModel]) {
          return MODELS[headerModel]
        }

        if (ctx.session.id) {
          const chat = await db.chat.findFirst({
            where: {
              eveSessionId: ctx.session.id,
            },
            select: {
              model: true,
            },
          })
          if (chat?.model && MODELS[chat.model]) {
            return MODELS[chat.model]
          }
        }

        return defaultModel
      },
    },
  }),
  modelContextWindowTokens: 256000,
})
