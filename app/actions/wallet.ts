"use server"

import db from '../../lib/db'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const getEncryptionKey = () => {
    const secret = process.env.WALLET_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-fallback-key-secret-1234'
    return createHash('sha256').update(secret).digest()
}

function encryptKey(text: string): string {
    const iv = randomBytes(16)
    const key = getEncryptionKey()
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
}

function decryptKey(encryptedText: string): string {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted key format')
    }
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const key = getEncryptionKey()
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

export type PublicWallet = {
    id: string
    name: string
    address: string
    type: string
}

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
    const encrypted = encryptKey(privateKey)

    const wallet = await db.wallet.create({
        data: {
            userId,
            name: name.trim(),
            address: account.address,
            type,
            encryptedKey: encrypted
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
        return decryptKey(wallet.encryptedKey)
    } catch (error) {
        throw new Error("Failed to decrypt private key: " + (error instanceof Error ? error.message : String(error)))
    }
}
