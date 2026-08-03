'use server'

import db from '../../../lib/db'
import { createClient } from '../../../lib/supabase/server'

export type CustomModelRecord = {
    id: string
    modelId: string
    name: string
    provider: string
    isReasoning: boolean
    createdAt: string
}

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return user
}

export async function getUserCustomModels(): Promise<CustomModelRecord[]> {
    const user = await getAuthenticatedUser()

    const models = await db.userCustomModel.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
    })

    return models.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        name: m.name,
        provider: m.provider,
        isReasoning: m.isReasoning,
        createdAt: m.createdAt.toISOString(),
    }))
}

export async function addCustomModel(input: {
    modelId: string
    name: string
    provider: string
    isReasoning?: boolean
}) {
    const user = await getAuthenticatedUser()

    const cleanModelId = input.modelId.trim()
    const cleanName = input.name.trim() || cleanModelId
    const cleanProvider = input.provider.trim().toLowerCase()

    if (!cleanModelId) {
        throw new Error('Model ID is required')
    }

    if (!cleanProvider) {
        throw new Error('Provider is required')
    }

    const key = await db.userProviderKey.findUnique({
        where: {
            userId_provider: {
                userId: user.id,
                provider: cleanProvider,
            },
        },
    })

    if (!key) {
        throw new Error(`API Key for provider '${cleanProvider}' must be configured first`)
    }

    await db.userCustomModel.upsert({
        where: {
            userId_modelId: {
                userId: user.id,
                modelId: cleanModelId,
            },
        },
        create: {
            userId: user.id,
            modelId: cleanModelId,
            name: cleanName,
            provider: cleanProvider,
            isReasoning: Boolean(input.isReasoning),
        },
        update: {
            name: cleanName,
            provider: cleanProvider,
            isReasoning: Boolean(input.isReasoning),
        },
    })

    return { success: true }
}

export async function deleteCustomModel(id: string) {
    const user = await getAuthenticatedUser()

    await db.userCustomModel.deleteMany({
        where: {
            id,
            userId: user.id,
        },
    })

    return { success: true }
}
