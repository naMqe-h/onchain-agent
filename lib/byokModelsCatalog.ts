export type PredefinedBYOKModel = {
    modelId: string
    name: string
    provider: string
    isReasoning?: boolean
    contextTokens?: number
    description?: string
}

export type ProviderCatalogEntry = {
    providerLabel: string
    icon: string
    models: PredefinedBYOKModel[]
}

export const BYOK_PROVIDER_CATALOG: Record<string, ProviderCatalogEntry> = {
    openai: {
        providerLabel: 'OpenAI',
        icon: 'openai.png',
        models: [
            { modelId: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'openai', isReasoning: true, contextTokens: 1000000, description: 'Flagship high intelligence reasoning model' },
            { modelId: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', provider: 'openai', isReasoning: true, contextTokens: 1000000, description: 'Balanced intelligence & efficiency' },
            { modelId: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'openai', isReasoning: true, contextTokens: 1000000, description: 'High volume cost efficient model' },
        ],
    },
    anthropic: {
        providerLabel: 'Anthropic Claude',
        icon: 'claude.png',
        models: [
            { modelId: 'claude-opus-5', name: 'Claude Opus 5', provider: 'anthropic', isReasoning: true, contextTokens: 1000000, description: 'Top tier frontier reasoning & analysis' },
            { modelId: 'claude-fable-5', name: 'Claude Fable 5', provider: 'anthropic', isReasoning: true, contextTokens: 1000000, description: 'Creative reasoning & synthesis' },
            { modelId: 'claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'anthropic', isReasoning: true, contextTokens: 1000000, description: 'Balanced coding & task execution' },
            { modelId: 'claude-4.5-haiku', name: 'Claude 4.5 Haiku', provider: 'anthropic', isReasoning: true, contextTokens: 200000, description: 'Fast lightweight model' },
        ],
    },
    google: {
        providerLabel: 'Google Gemini',
        icon: 'gemini.png',
        models: [
            { modelId: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: 'google', isReasoning: true, contextTokens: 1000000, description: 'High speed agentic multimodal model' },
            { modelId: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'google', isReasoning: true, contextTokens: 1000000, description: 'Fast multimodal model' },
            { modelId: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro Preview', provider: 'google', isReasoning: true, contextTokens: 1000000, description: 'Advanced reasoning & 1M context' },
        ],
    },
    xai: {
        providerLabel: 'xAI (Grok)',
        icon: 'grok.png',
        models: [
            { modelId: 'grok-4.5', name: 'Grok 4.5', provider: 'xai', isReasoning: true, contextTokens: 500000, description: 'Frontier reasoning model by xAI' },
            { modelId: 'grok-4.3', name: 'Grok 4.3', provider: 'xai', isReasoning: true, contextTokens: 1000000, description: 'Fast general purpose model' },
        ],
    },
    openrouter: {
        providerLabel: 'OpenRouter',
        icon: 'openrouter.png',
        models: [
            { modelId: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'openrouter', isReasoning: true, contextTokens: 1000000, description: 'Advanced open reasoning model' },
            { modelId: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'openrouter', isReasoning: true, contextTokens: 1000000, description: 'High speed open model' },
            { modelId: 'qwen/qwen-3.7-max', name: 'Qwen 3.7 Max', provider: 'openrouter', isReasoning: true, contextTokens: 1000000, description: 'Flagship Qwen model' },
            { modelId: 'qwen/qwen-3.6-35b', name: 'Qwen 3.6 35B', provider: 'openrouter', isReasoning: true, contextTokens: 262000, description: 'Efficient coding & instruction model' },
            { modelId: 'mistralai/mistral-medium-3.5', name: 'Mistral Medium 3.5', provider: 'openrouter', isReasoning: true, contextTokens: 256000, description: 'Balanced open weights chat model' },
        ],
    },
}
