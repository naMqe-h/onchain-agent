import {
    DEFAULT_MODEL_ID,
    isSupportedModelId,
    type ChatModelOption,
    type SupportedModelId,
} from '@/lib/models'

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

export function resolveUserModelPreferences(
    catalog: ChatModelOption[],
    metadata?: {
        defaultModel?: string
        enabledModels?: string[]
    }
): UserModelPreferences {
    const catalogIds = catalog.map((m) => m.id)
    const fallbackDefault = catalogIds[0] ?? DEFAULT_MODEL_ID

    if (catalogIds.length === 0) {
        return {
            catalog,
            enabledModelIds: [],
            defaultModelId: DEFAULT_MODEL_ID,
            didHeal: false,
        }
    }

    const rawEnabled = metadata?.enabledModels
    const hasExplicitEnabled = Array.isArray(rawEnabled) && rawEnabled.length > 0

    let enabledModelIds = hasExplicitEnabled
        ? rawEnabled.filter((id) => catalogIds.includes(id))
        : [...catalogIds]

    if (hasExplicitEnabled && enabledModelIds.length === 0) {
        enabledModelIds = [...catalogIds]
    }

    const rawDefault = metadata?.defaultModel
    let defaultModelId =
        typeof rawDefault === 'string' && enabledModelIds.includes(rawDefault)
            ? rawDefault
            : enabledModelIds[0] ?? fallbackDefault

    if (!enabledModelIds.includes(defaultModelId)) {
        defaultModelId = enabledModelIds[0] ?? fallbackDefault
    }

    const enabledChanged =
        hasExplicitEnabled &&
        (rawEnabled.length !== enabledModelIds.length ||
            rawEnabled.some((id) => !enabledModelIds.includes(id)))

    const defaultChanged = rawDefault !== defaultModelId

    const shouldPersistHeal = defaultChanged || enabledChanged

    return {
        catalog,
        enabledModelIds,
        defaultModelId,
        didHeal: shouldPersistHeal,
        healedMetadata: shouldPersistHeal
            ? {
                defaultModel: defaultModelId,
                enabledModels: enabledModelIds,
            }
            : undefined,
    }
}

export function clampToSupportedModelId(model: string | undefined | null): SupportedModelId {
    if (model && isSupportedModelId(model)) return model
    return DEFAULT_MODEL_ID
}

export function mapChatModelRow(row: {
    id: string
    name: string
    shortName: string
    providerLabel: string
    isReasoning: boolean
    latencyMs: number
    contextTokens: number
}): ChatModelOption {
    return {
        id: row.id,
        name: row.name,
        shortName: row.shortName,
        provider: row.providerLabel,
        isReasoning: row.isReasoning,
        latencyMs: row.latencyMs,
        contextTokens: row.contextTokens,
    }
}
