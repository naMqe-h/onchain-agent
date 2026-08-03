import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto'

export type EncryptedProviderPayload = {
    encryptedKey: string
    iv: string
    salt: string
}

function getSecretKey(): string {
    const secret = process.env.WALLET_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'byok-provider-secret-fallback-1234'
    return secret
}

function deriveKey(secret: string, salt: Buffer): Buffer {
    return pbkdf2Sync(secret, salt, 100000, 32, 'sha256')
}

export function encryptProviderKey(apiKey: string): EncryptedProviderPayload {
    const secret = getSecretKey()
    const iv = randomBytes(16)
    const salt = randomBytes(16)
    const key = deriveKey(secret, salt)
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return {
        encryptedKey: encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
    }
}

export function decryptProviderKey(payload: EncryptedProviderPayload): string {
    const secret = getSecretKey()
    const iv = Buffer.from(payload.iv, 'hex')
    const salt = Buffer.from(payload.salt, 'hex')
    const key = deriveKey(secret, salt)
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(payload.encryptedKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

export function maskApiKey(apiKey: string): string {
    if (!apiKey) return ''
    if (apiKey.length <= 8) return '••••••••'
    const start = apiKey.slice(0, 7)
    const end = apiKey.slice(-4)
    return `${start}...${end}`
}
