import db from './db'
import {
    DEFAULT_MODEL_ID,
    isSupportedModelId,
    type ChatModelOption,
} from './models'
import { mapChatModelRow } from './modelPreferences'

export {
    resolveUserModelPreferences,
    clampToSupportedModelId,
    mapChatModelRow,
} from './modelPreferences'
export type { UserModelPreferences } from '../types'

const PROVIDER_ICONS: Record<string, string> = {
    openai: 'openai.png',
    anthropic: 'claude.png',
    google: 'gemini.png',
    xai: 'grok.png',
    grok: 'grok.png',
    openrouter: 'openrouter.png',
    cohere: 'cohere.png',
}

export async function getEnabledModelCatalog(userId?: string): Promise<ChatModelOption[]> {
    const rows = await db.chatModel.findMany({
        where: { isEnabled: true },
        orderBy: { sortOrder: 'asc' },
    })

    const appModels: ChatModelOption[] = rows
        .filter((row) => isSupportedModelId(row.id))
        .map(mapChatModelRow)

    if (!userId) {
        return appModels
    }

    const userKeys = await db.userProviderKey.findMany({
        where: { userId },
        select: { provider: true },
    })

    const activeProviders = new Set(userKeys.map((k) => k.provider.toLowerCase()))

    if (activeProviders.size === 0) {
        return appModels
    }

    const customRows = await db.userCustomModel.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    })

    const userModels: ChatModelOption[] = customRows
        .filter((row) => activeProviders.has(row.provider.toLowerCase()))
        .map((row) => ({
            id: row.modelId,
            name: row.name,
            shortName: row.name,
            provider: row.provider,
            isReasoning: row.isReasoning,
            icon: PROVIDER_ICONS[row.provider.toLowerCase()] ?? 'openai.png',
            section: 'user' as const,
            isCustom: true,
            customId: row.id,
        }))

    return [...appModels, ...userModels]
}

export async function ensureChatModelAllowed(
    chatId: string,
    currentModel: string,
    catalogIds: string[],
    defaultModelId: string
): Promise<string> {
    if (catalogIds.includes(currentModel) || isSupportedModelId(currentModel)) {
        return currentModel
    }

    const nextModel = catalogIds.includes(defaultModelId)
        ? defaultModelId
        : catalogIds[0] ?? DEFAULT_MODEL_ID

    await db.chat.update({
        where: { id: chatId },
        data: { model: nextModel },
    })

    return nextModel
}

