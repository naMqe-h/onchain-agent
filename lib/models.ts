import {
    type LatencyTier,
    type ContextTier,
    type ModelProvider,
    type SupportedModelConfig,
    type ChatModelOption,
    type SupportedModelId,
} from '../types'

export type {
    LatencyTier,
    ContextTier,
    ModelProvider,
    SupportedModelConfig,
    ChatModelOption,
    SupportedModelId,
}

export const SUPPORTED_MODELS = {
    'gpt-4.1-nano': {
        provider: 'openai',
        modelId: 'gpt-4.1-nano',
    },
    'cohere/north-mini-code:free': {
        provider: 'openrouter',
        modelId: 'cohere/north-mini-code:free',
    },
    'google/gemma-4-31b-it:free': {
        provider: 'openrouter',
        modelId: 'google/gemma-4-31b-it:free',
    },
    'openai/gpt-oss-20b:free': {
        provider: 'openrouter',
        modelId: 'openai/gpt-oss-20b:free',
    },
} as const satisfies Record<string, SupportedModelConfig>

export const DEFAULT_MODEL_ID: SupportedModelId = 'cohere/north-mini-code:free'

export const SUPPORTED_MODEL_IDS = Object.keys(SUPPORTED_MODELS) as SupportedModelId[]

export function isSupportedModelId(id: string): id is SupportedModelId {
    return id in SUPPORTED_MODELS
}

export function getLatencyTier(ms: number): LatencyTier {
    if (ms < 600) return 'Low'
    if (ms <= 1500) return 'Medium'
    return 'High'
}

export function getContextTier(tokens: number): ContextTier {
    if (tokens < 200_000) return 'Small'
    if (tokens <= 512_000) return 'Medium'
    return 'Large'
}

export function formatContextWindow(tokens: number): string {
    if (tokens >= 1_000_000) {
        const millions = tokens / 1_000_000
        return Number.isInteger(millions) ? `${millions}M` : `${parseFloat(millions.toFixed(1))}M`
    }
    if (tokens >= 1000) {
        const thousands = tokens / 1000
        return Number.isInteger(thousands) ? `${thousands}k` : `${parseFloat(thousands.toFixed(0))}k`
    }
    return String(tokens)
}
