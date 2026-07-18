import { defineAgent, defineDynamic } from "eve"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createOpenAI } from "@ai-sdk/openai"
import db from "../lib/db"
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS, type SupportedModelId } from "../lib/models"

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function resolveLanguageModel(id: SupportedModelId) {
  const config = SUPPORTED_MODELS[id]
  if (config.provider === "openai") {
    return openai(config.modelId)
  }
  return openrouter(config.modelId)
}

const defaultModel = resolveLanguageModel(DEFAULT_MODEL_ID)

const MODELS: Record<string, ReturnType<typeof resolveLanguageModel>> = Object.fromEntries(
  (Object.keys(SUPPORTED_MODELS) as SupportedModelId[]).map((id) => [id, resolveLanguageModel(id)])
)

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
  limits: {
    maxInputTokensPerSession: 2_000_000,
    maxOutputTokensPerSession: 500_000,
  },
})
