import { createHash, randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from "crypto"

export type EncryptedWalletPayload = {
    encryptedKey: string
    iv: string
    salt: string
}

export type DecryptWalletInput =
    | string
    | {
          encryptedKey: string
          iv?: string | null
          salt?: string | null
      }

function getSecretKey(): string {
    const secret = process.env.WALLET_ENCRYPTION_KEY
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("WALLET_ENCRYPTION_KEY environment variable is required in production environment")
        }
        return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "default-fallback-key-secret-1234"
    }
    return secret
}

function deriveKey(secret: string, salt: Buffer): Buffer {
    return pbkdf2Sync(secret, salt, 100000, 32, "sha256")
}

function deriveLegacyKey(secret: string): Buffer {
    return createHash("sha256").update(secret).digest()
}

export function encryptWalletKey(privateKey: string): EncryptedWalletPayload {
    const secret = getSecretKey()
    const iv = randomBytes(16)
    const salt = randomBytes(16)
    const key = deriveKey(secret, salt)
    const cipher = createCipheriv("aes-256-cbc", key, iv)
    let encrypted = cipher.update(privateKey, "utf8", "hex")
    encrypted += cipher.final("hex")
    return {
        encryptedKey: encrypted,
        iv: iv.toString("hex"),
        salt: salt.toString("hex")
    }
}

export function decryptWalletKey(input: DecryptWalletInput): string {
    const secret = getSecretKey()

    let encryptedHex: string
    let ivHex: string | null = null
    let saltHex: string | null = null

    if (typeof input === "string") {
        const parts = input.split(":")
        if (parts.length === 2) {
            ivHex = parts[0]
            encryptedHex = parts[1]
        } else {
            encryptedHex = input
        }
    } else {
        encryptedHex = input.encryptedKey
        ivHex = input.iv || null
        saltHex = input.salt || null

        if (!ivHex && encryptedHex.includes(":")) {
            const parts = encryptedHex.split(":")
            if (parts.length === 2) {
                ivHex = parts[0]
                encryptedHex = parts[1]
            }
        }
    }

    if (!ivHex) {
        throw new Error("Invalid encrypted key: missing initialization vector (IV)")
    }

    const iv = Buffer.from(ivHex, "hex")
    let key: Buffer
    if (saltHex) {
        const salt = Buffer.from(saltHex, "hex")
        key = deriveKey(secret, salt)
    } else {
        key = deriveLegacyKey(secret)
    }

    const decipher = createDecipheriv("aes-256-cbc", key, iv)
    let decrypted = decipher.update(encryptedHex, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
}
