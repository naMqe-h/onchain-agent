'use server'

import db from '../../../lib/db'
import { createClient } from '../../../lib/supabase/server'
import { encryptProviderKey, decryptProviderKey, maskApiKey } from '../../../lib/providerCrypto'

export type PublicProviderKeyInfo = {
    provider: string
    maskedKey: string
    updatedAt: string
}

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return user
}

export async function getUserProviderKeys(): Promise<PublicProviderKeyInfo[]> {
    const user = await getAuthenticatedUser()

    const keys = await db.userProviderKey.findMany({
        where: { userId: user.id },
        select: {
            provider: true,
            encryptedKey: true,
            iv: true,
            salt: true,
            updatedAt: true,
        },
    })

    return keys.map((k) => {
        let masked = '••••••••'
        try {
            const rawKey = decryptProviderKey({
                encryptedKey: k.encryptedKey,
                iv: k.iv,
                salt: k.salt,
            })
            masked = maskApiKey(rawKey)
        } catch (err) {
            console.error(`Failed to decrypt key for provider ${k.provider}:`, err)
        }

        return {
            provider: k.provider,
            maskedKey: masked,
            updatedAt: k.updatedAt.toISOString(),
        }
    })
}

export async function saveUserProviderKey(provider: string, apiKey: string) {
    const user = await getAuthenticatedUser()

    const cleanProvider = provider.trim().toLowerCase()
    const cleanKey = apiKey.trim()

    if (!cleanProvider) {
        throw new Error('Provider is required')
    }

    if (!cleanKey) {
        throw new Error('API Key is required')
    }

    const payload = encryptProviderKey(cleanKey)

    await db.userProviderKey.upsert({
        where: {
            userId_provider: {
                userId: user.id,
                provider: cleanProvider,
            },
        },
        create: {
            userId: user.id,
            provider: cleanProvider,
            encryptedKey: payload.encryptedKey,
            iv: payload.iv,
            salt: payload.salt,
        },
        update: {
            encryptedKey: payload.encryptedKey,
            iv: payload.iv,
            salt: payload.salt,
        },
    })

    return { success: true }
}

export async function deleteUserProviderKey(provider: string) {
    const user = await getAuthenticatedUser()

    const cleanProvider = provider.trim().toLowerCase()

    await db.userProviderKey.deleteMany({
        where: {
            userId: user.id,
            provider: cleanProvider,
        },
    })

    return { success: true }
}
