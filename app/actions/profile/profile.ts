'use server'

import db from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { validatePasswordStrength } from '@/lib/password'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

export type PublicProfile = {
    id: string
    userId: string
    displayName: string
    avatarUrl: string | null
}

function defaultDisplayName(email: string | undefined): string {
    if (!email) return 'User'
    return email.split('@')[0] || 'User'
}

function toPublicProfile(profile: {
    id: string
    userId: string
    displayName: string
    avatarUrl: string | null
}): PublicProfile {
    return {
        id: profile.id,
        userId: profile.userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
    }
}

async function requireUser() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    return { supabase, user }
}

export async function getOrCreateProfile(): Promise<PublicProfile> {
    const { user } = await requireUser()

    const existing = await db.profile.findUnique({
        where: { userId: user.id },
    })

    if (existing) {
        return toPublicProfile(existing)
    }

    const created = await db.profile.create({
        data: {
            userId: user.id,
            displayName: defaultDisplayName(user.email),
        },
    })

    return toPublicProfile(created)
}

export async function updateDisplayName(
    displayName: string
): Promise<{ profile?: PublicProfile; error?: string }> {
    try {
        const { user } = await requireUser()
        const trimmed = displayName.trim()

        if (trimmed.length < 1 || trimmed.length > 50) {
            return { error: 'Display name must be between 1 and 50 characters' }
        }

        const profile = await db.profile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                displayName: trimmed,
            },
            update: {
                displayName: trimmed,
            },
        })

        return { profile: toPublicProfile(profile) }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update display name'
        return { error: message }
    }
}

export async function uploadAvatar(
    formData: FormData
): Promise<{ profile?: PublicProfile; error?: string }> {
    try {
        const { supabase, user } = await requireUser()
        const file = formData.get('avatar')

        if (!(file instanceof File) || file.size === 0) {
            return { error: 'No image file provided' }
        }

        if (file.size > MAX_AVATAR_BYTES) {
            return { error: 'Image must be 2 MB or smaller' }
        }

        const ext = ALLOWED_MIME[file.type]
        if (!ext) {
            return { error: 'Only JPEG, PNG, and WebP images are allowed' }
        }

        const path = `${user.id}/avatar.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())

        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, buffer, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600',
        })

        if (uploadError) {
            return { error: uploadError.message }
        }

        const {
            data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)

        const avatarUrl = `${publicUrl}?t=${Date.now()}`

        const profile = await db.profile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                displayName: defaultDisplayName(user.email),
                avatarUrl,
            },
            update: {
                avatarUrl,
            },
        })

        return { profile: toPublicProfile(profile) }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload avatar'
        return { error: message }
    }
}

export async function removeAvatar(): Promise<{ profile?: PublicProfile; error?: string }> {
    try {
        const { supabase, user } = await requireUser()

        const existing = await db.profile.findUnique({
            where: { userId: user.id },
        })

        if (existing?.avatarUrl) {
            const { data: files } = await supabase.storage.from('avatars').list(user.id)
            if (files && files.length > 0) {
                const paths = files.map((f) => `${user.id}/${f.name}`)
                await supabase.storage.from('avatars').remove(paths)
            }
        }

        const profile = await db.profile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                displayName: defaultDisplayName(user.email),
                avatarUrl: null,
            },
            update: {
                avatarUrl: null,
            },
        })

        return { profile: toPublicProfile(profile) }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove avatar'
        return { error: message }
    }
}

export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const { supabase, user } = await requireUser()

        if (!user.email) {
            return { error: 'Account has no email address' }
        }

        const strengthError = validatePasswordStrength(newPassword)
        if (strengthError) {
            return { error: strengthError }
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        })

        if (verifyError) {
            return { error: 'Current password is incorrect' }
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        })

        if (updateError) {
            return { error: updateError.message }
        }

        return { success: true }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to change password'
        return { error: message }
    }
}
