"use server"

import db from '../../lib/db'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export async function createBurnerWallet(userId: string) {
    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)

    const result = await db.$queryRaw<{ encrypted: string }[]>`
        SELECT encode(
            pgsodium.crypto_aead_det_encrypt(
                convert_to(${privateKey}, 'utf8'),
                convert_to('wallet', 'utf8'),
                (SELECT id FROM pgsodium.key WHERE name = 'wallet_key' LIMIT 1)
            ),
            'base64'
        ) AS encrypted
    `

    if (!result || result.length === 0 || !result[0].encrypted) {
        throw new Error("Failed to encrypt private key using Supabase Vault")
    }

    const encrypted = result[0].encrypted

    const wallet = await db.wallet.create({
        data: {
            userId,
            address: account.address,
            type: 'burner',
            encryptedKey: encrypted
        }
    })

    return {
        id: wallet.id,
        address: wallet.address
    }
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

    const result = await db.$queryRaw<{ decrypted: string }[]>`
        SELECT convert_from(
            pgsodium.crypto_aead_det_decrypt(
                decode(${wallet.encryptedKey}, 'base64'),
                convert_to('wallet', 'utf8'),
                (SELECT id FROM pgsodium.key WHERE name = 'wallet_key' LIMIT 1)
            ),
            'utf8'
        ) AS decrypted
    `

    if (!result || result.length === 0 || !result[0].decrypted) {
        throw new Error("Failed to decrypt private key using Supabase Vault")
    }

    return result[0].decrypted as string
}
