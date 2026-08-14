import { defineAgent, defineDynamic } from "eve"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import db from "../lib/db"
import { type SupportedModelId } from "../types"
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS } from "../lib/models"
import { decryptProviderKey } from "../lib/providerCrypto"

function getOpenRouterClient(apiKey?: string | null) {
    const key = (apiKey || process.env.OPENROUTER_API_KEY || '').trim()
    return createOpenRouter({
        apiKey: key,
    })
}

function getOpenAIClient(apiKey?: string | null) {
    const key = (apiKey || process.env.OPENAI_API_KEY || '').trim()
    return createOpenAI({
        apiKey: key,
    })
}

async function getDecryptedUserKey(userId: string, provider: string): Promise<string | null> {
    try {
        const keyRecord = await db.userProviderKey.findUnique({
            where: {
                userId_provider: {
                    userId,
                    provider: provider.toLowerCase(),
                },
            },
        })
        if (!keyRecord) return null
        return decryptProviderKey({
            encryptedKey: keyRecord.encryptedKey,
            iv: keyRecord.iv,
            salt: keyRecord.salt,
        })
    } catch (err) {
        console.error(`Failed to decrypt key for provider ${provider}:`, err)
        return null
    }
}

function resolveModelForProvider(modelId: string, provider: string, apiKey?: string | null) {
    const cleanProvider = provider.toLowerCase()

    if (cleanProvider === 'openai') {
        const client = getOpenAIClient(apiKey)
        return client(modelId)
    }

    if (cleanProvider === 'openrouter') {
        const client = getOpenRouterClient(apiKey)
        return client(modelId)
    }

    if (cleanProvider === 'google') {
        const googleClient = createGoogleGenerativeAI({
            apiKey: (apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim(),
        })
        return googleClient(modelId)
    }

    if (cleanProvider === 'anthropic') {
        const anthropicClient = createAnthropic({
            apiKey: (apiKey || process.env.ANTHROPIC_API_KEY || '').trim(),
        })
        return anthropicClient(modelId)
    }

    if (cleanProvider === 'xai' || cleanProvider === 'grok') {
        const xaiClient = createOpenAI({
            baseURL: 'https://api.x.ai/v1',
            apiKey: (apiKey || process.env.XAI_API_KEY || '').trim(),
        })
        return xaiClient(modelId)
    }

    const fallbackClient = getOpenRouterClient(apiKey)
    return fallbackClient(modelId)
}

function resolveDefaultStaticModel(id: SupportedModelId) {
    const config = SUPPORTED_MODELS[id]
    if (config.provider === "openai") {
        return getOpenAIClient()(config.modelId)
    }
    return getOpenRouterClient()(config.modelId)
}

export default defineAgent({
    model: defineDynamic({
        events: {
            "step.started": async (event, ctx) => {
                const headerModel = ctx.session.auth.current?.attributes?.modelName

                const eveSessionId: string | null = ctx.session.id || null
                let chatModel: string | null = null
                let userId: string | null = null

                if (eveSessionId) {
                    const chat = await db.chat.findFirst({
                        where: { eveSessionId },
                        select: { id: true, model: true, userId: true },
                    })
                    if (chat) {
                        chatModel = chat.model
                        userId = chat.userId
                    }
                }

                const requestedModelId = chatModel || (typeof headerModel === 'string' ? headerModel : DEFAULT_MODEL_ID)

                if (userId) {
                    const customModel = await db.userCustomModel.findFirst({
                        where: { userId, modelId: requestedModelId },
                    })

                    if (customModel) {
                        const apiKey = await getDecryptedUserKey(userId, customModel.provider)
                        if (!apiKey) {
                            throw new Error(`API key required for ${customModel.provider.toUpperCase()}. Please configure your API key in Settings -> Providers.`)
                        }
                        const resolved = resolveModelForProvider(customModel.modelId, customModel.provider, apiKey)
                        return { model: resolved, modelContextWindowTokens: 256000 }
                    }

                    if (requestedModelId in SUPPORTED_MODELS) {
                        const staticConfig = SUPPORTED_MODELS[requestedModelId as SupportedModelId]
                        const userKey = await getDecryptedUserKey(userId, staticConfig.provider)
                        if (userKey) {
                            const resolved = resolveModelForProvider(staticConfig.modelId, staticConfig.provider, userKey)
                            return { model: resolved, modelContextWindowTokens: 256000 }
                        }
                    }
                }

                if (requestedModelId in SUPPORTED_MODELS) {
                    const resolved = resolveDefaultStaticModel(requestedModelId as SupportedModelId)
                    return { model: resolved, modelContextWindowTokens: 256000 }
                }

                const resolvedDefault = resolveDefaultStaticModel(DEFAULT_MODEL_ID)
                return { model: resolvedDefault, modelContextWindowTokens: 256000 }
            },
        },
    }),
    compaction: {
        thresholdPercent: 0.8,
    },
    limits: {
        maxInputTokensPerSession: 2_000_000,
        maxOutputTokensPerSession: 500_000,
    },
})
