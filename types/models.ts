export type LatencyTier = 'Low' | 'Medium' | 'High'
export type ContextTier = 'Small' | 'Medium' | 'Large'

export type ModelProvider = 'openai' | 'openrouter'

export type SupportedModelConfig = {
    provider: ModelProvider
    modelId: string
}

export type SupportedModelId =
    | 'gpt-4.1-nano'
    | 'cohere/north-mini-code:free'
    | 'google/gemma-4-31b-it:free'
    | 'openai/gpt-oss-20b:free'

export type ChatModelOption = {
    id: string
    name: string
    shortName: string
    provider: string
    isReasoning: boolean
    latencyTier?: LatencyTier
    contextTier?: ContextTier
    latencyMs?: number
    contextTokens?: number
    isDefault?: boolean
}

export type UserModelPreferences = {
    catalog: ChatModelOption[]
    enabledModelIds: string[]
    defaultModelId: string
    didHeal: boolean
    healedMetadata?: {
        defaultModel: string
        enabledModels: string[]
    }
}

export type LlmUsageSource = 'provider' | 'estimated' | 'missing'

export type RecordLlmUsageInput = {
    userId: string
    chatId?: string | null
    eveSessionId?: string | null
    model: string
    provider: string
    stepIndex?: number | null
    inputTokens?: number
    outputTokens?: number
    cacheReadTokens?: number
    cacheWriteTokens?: number
    source: LlmUsageSource
    durationMs?: number | null
    timeZone?: string | null
}

export type TiktokenEncodingName = 'o200k_base' | 'cl100k_base'

export type ChatMessageLike = {
    role?: string
    content?: any
    parts?: readonly any[]
}

export type ChatTokenUsage = {
    totalTokens: number
}

export type QuotaLevel = 'ok' | 'soft' | 'hard'

export type QuotaCheckResult = {
    level: QuotaLevel
    enforce: boolean
    blocked: boolean
    reasons: string[]
    resetsInLabel: string | null
    dayResetsInLabel: string
    timeZone: string
    usage: {
        tokensToday: number
        requestsToday: number
        requestsLastMinute: number
        tokensPerDayLimit: number
        requestsPerDayLimit: number
        requestsPerMinuteLimit: number
        softTokenThreshold: number
    }
}

export type UsageSummary = {
    today: {
        inputTokens: number
        outputTokens: number
        totalTokens: number
        requests: number
    }
    last7Days: {
        inputTokens: number
        outputTokens: number
        totalTokens: number
        requests: number
    }
    byModel: Array<{
        model: string
        provider: string
        inputTokens: number
        outputTokens: number
        cacheReadTokens: number
        totalTokens: number
        requests: number
    }>
    quota: QuotaCheckResult
}
