export type TxConfirmationMode = 'always' | 'agent_decides' | 'never'

export const DEFAULT_TX_CONFIRMATION_MODE: TxConfirmationMode = 'always'

export const TX_CONFIRMATION_OPTIONS: readonly {
    id: TxConfirmationMode
    label: string
    description: string
    warning?: string
}[] = [
    {
        id: 'always',
        label: 'Always ask',
        description: 'The agent always confirms transaction details with you before calling any on-chain send tool.',
    },
    {
        id: 'agent_decides',
        label: 'Agent decides',
        description: 'The agent may skip confirmation for lower-risk transactions, and ask when amounts, recipients, or intent look riskier.',
    },
    {
        id: 'never',
        label: 'Never ask (YOLO)',
        description: 'The agent executes on-chain transactions without asking for confirmation once details are clear.',
        warning: 'Real crypto can leave your wallet immediately. Use only if you trust the agent and your prompts.',
    },
] as const

export function normalizeTxConfirmationMode(value: unknown): TxConfirmationMode {
    if (value === 'always' || value === 'agent_decides' || value === 'never') {
        return value
    }
    return DEFAULT_TX_CONFIRMATION_MODE
}
