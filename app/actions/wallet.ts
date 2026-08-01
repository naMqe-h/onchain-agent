"use server"

import db from '../../lib/db'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createClient } from '../../lib/supabase/server'
import { PublicWallet } from '@/types'
import { encryptWalletKey, decryptWalletKey } from '../../lib/web3/walletCrypto'

export async function getUserWallets(userId: string): Promise<PublicWallet[]> {
    return db.wallet.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            name: true,
            address: true,
            type: true,
        },
    })
}

export async function createWallet(userId: string, name: string, type: 'burner' | 'imported', importedKey?: string) {
    if (!name || !name.trim()) {
        throw new Error('Wallet name is required')
    }

    const existing = await db.wallet.findFirst({
        where: {
            userId,
            name: {
                equals: name.trim(),
                mode: 'insensitive'
            }
        }
    })

    if (existing) {
        throw new Error('A wallet with this name already exists')
    }

    const addressBookConflict = await db.addressBookEntry.findFirst({
        where: {
            userId,
            name: {
                equals: name.trim(),
                mode: 'insensitive',
            },
        },
        select: { id: true },
    })

    if (addressBookConflict) {
        throw new Error('An address book entry with this name already exists')
    }

    let privateKey: string
    if (type === 'burner') {
        privateKey = generatePrivateKey()
    } else {
        if (!importedKey) {
            throw new Error('Private key is required for imported wallets')
        }
        let keyStr = importedKey.trim()
        if (!keyStr.startsWith('0x')) {
            keyStr = `0x${keyStr}`
        }
        if (keyStr.length !== 66) {
            throw new Error('Invalid private key length. Must be 32 bytes hex string (64 characters, plus optional 0x prefix)')
        }
        privateKey = keyStr
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const encryptedData = encryptWalletKey(privateKey)

    const wallet = await db.wallet.create({
        data: {
            userId,
            name: name.trim(),
            address: account.address,
            type,
            encryptedKey: encryptedData.encryptedKey,
            iv: encryptedData.iv,
            salt: encryptedData.salt
        }
    })

    return {
        id: wallet.id,
        address: wallet.address,
        name: wallet.name
    }
}

export async function createBurnerWallet(userId: string) {
    return createWallet(userId, 'Main Burner Wallet', 'burner')
}

export async function getWalletPrivateKey(userId: string, address: string) {
    const wallet = await db.wallet.findFirst({
        where: {
            userId,
            address
        }
    })

    if (!wallet) {
        throw new Error("Wallet not found")
    }

    try {
        return decryptWalletKey(wallet)
    } catch (error) {
        throw new Error("Failed to decrypt private key: " + (error instanceof Error ? error.message : String(error)))
    }
}

export async function revealWalletPrivateKey(address: string, password: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        if (!user.email) {
            return { error: 'Account has no email address' }
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password
        })

        if (verifyError) {
            return { error: 'Incorrect password' }
        }

        const privateKey = await getWalletPrivateKey(user.id, address)
        return { privateKey }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to retrieve private key' }
    }
}

export async function deleteWallet(walletId: string, password: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        if (!user.email) {
            return { error: 'Account has no email address' }
        }

        const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password
        })

        if (verifyError) {
            return { error: 'Incorrect password' }
        }

        const wallet = await db.wallet.findFirst({
            where: {
                id: walletId,
                userId: user.id
            }
        })

        if (!wallet) {
            return { error: 'Wallet not found' }
        }

        await db.wallet.delete({
            where: { id: walletId }
        })

        return { success: true }
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : 'Failed to delete wallet' }
    }
}

