export type ChatModelOption = {
    id: string
    name: string
    shortName: string
    provider: string
    isReasoning: boolean
}

export const AVAILABLE_MODELS: ChatModelOption[] = [
    {
        id: 'gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        shortName: 'GPT-4.1',
        provider: 'OpenAI',
        isReasoning: false
    },
    {
        id: 'cohere/north-mini-code:free',
        name: 'North Mini Code',
        shortName: 'North Mini',
        provider: 'Cohere',
        isReasoning: true
    }
]
