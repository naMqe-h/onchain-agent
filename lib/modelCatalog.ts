import db from '@/lib/db'
import {
    DEFAULT_MODEL_ID,
    isSupportedModelId,
    type ChatModelOption,
} from '@/lib/models'
import { mapChatModelRow } from '@/lib/modelPreferences'

export {
    resolveUserModelPreferences,
    clampToSupportedModelId,
    mapChatModelRow,
    type UserModelPreferences,
} from '@/lib/modelPreferences'

export async function getEnabledModelCatalog(): Promise<ChatModelOption[]> {
    const rows = await db.chatModel.findMany({
        where: { isEnabled: true },
        orderBy: { sortOrder: 'asc' },
    })

    return rows
        .filter((row) => isSupportedModelId(row.id))
        .map(mapChatModelRow)
}

export async function ensureChatModelAllowed(
    chatId: string,
    currentModel: string,
    catalogIds: string[],
    defaultModelId: string
): Promise<string> {
    if (catalogIds.includes(currentModel) && isSupportedModelId(currentModel)) {
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
