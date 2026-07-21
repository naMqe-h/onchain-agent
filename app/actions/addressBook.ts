'use server'

import { PublicAddressBookEntry } from '@/types'
import db from '../../lib/db'
import { createClient } from '../../lib/supabase/server'
import {
    assertUniqueLabel,
    isValidEvmAddress,
    normalizeEvmAddress,
} from '../../lib/web3/addressValidation'

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

function toPublic(entry: { id: string; name: string; address: string }): PublicAddressBookEntry {
    return {
        id: entry.id,
        name: entry.name,
        address: entry.address,
    }
}

export async function listAddressBook(): Promise<PublicAddressBookEntry[]> {
    const { user } = await requireUser()

    const entries = await db.addressBookEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, address: true },
    })

    return entries.map(toPublic)
}

export async function createAddressBookEntry(
    name: string,
    address: string
): Promise<{ entry?: PublicAddressBookEntry; error?: string }> {
    try {
        const { user } = await requireUser()
        const trimmedName = name?.trim()
        if (!trimmedName) {
            return { error: 'Name is required' }
        }

        const trimmedAddress = address?.trim()
        if (!trimmedAddress || !isValidEvmAddress(trimmedAddress)) {
            return { error: 'Invalid EVM address' }
        }

        await assertUniqueLabel(user.id, trimmedName)

        const normalized = normalizeEvmAddress(trimmedAddress)

        const created = await db.addressBookEntry.create({
            data: {
                userId: user.id,
                name: trimmedName,
                address: normalized,
            },
            select: { id: true, name: true, address: true },
        })

        return { entry: toPublic(created) }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to create address book entry' }
    }
}

export async function updateAddressBookEntry(
    id: string,
    data: { name?: string; address?: string }
): Promise<{ entry?: PublicAddressBookEntry; error?: string }> {
    try {
        const { user } = await requireUser()

        const existing = await db.addressBookEntry.findFirst({
            where: { id, userId: user.id },
        })

        if (!existing) {
            return { error: 'Address book entry not found' }
        }

        const nextName = data.name !== undefined ? data.name.trim() : existing.name
        if (!nextName) {
            return { error: 'Name is required' }
        }

        let nextAddress = existing.address
        if (data.address !== undefined) {
            const trimmedAddress = data.address.trim()
            if (!trimmedAddress || !isValidEvmAddress(trimmedAddress)) {
                return { error: 'Invalid EVM address' }
            }
            nextAddress = normalizeEvmAddress(trimmedAddress)
        }

        if (nextName.toLowerCase() !== existing.name.toLowerCase()) {
            await assertUniqueLabel(user.id, nextName, {
                excludeAddressBookEntryId: existing.id,
            })
        }

        const updated = await db.addressBookEntry.update({
            where: { id: existing.id },
            data: {
                name: nextName,
                address: nextAddress,
            },
            select: { id: true, name: true, address: true },
        })

        return { entry: toPublic(updated) }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to update address book entry' }
    }
}

export async function deleteAddressBookEntry(
    id: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const { user } = await requireUser()

        const existing = await db.addressBookEntry.findFirst({
            where: { id, userId: user.id },
            select: { id: true },
        })

        if (!existing) {
            return { error: 'Address book entry not found' }
        }

        await db.addressBookEntry.delete({ where: { id: existing.id } })
        return { success: true }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to delete address book entry' }
    }
}
