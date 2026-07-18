import { createHash, createDecipheriv } from "crypto"

function getEncryptionKey() {
    const secret =
        process.env.WALLET_ENCRYPTION_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "default-fallback-key-secret-1234"
    return createHash("sha256").update(secret).digest()
}

export function decryptWalletKey(encryptedText: string): string {
    const parts = encryptedText.split(":")
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted key format")
    }
    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]
    const key = getEncryptionKey()
    const decipher = createDecipheriv("aes-256-cbc", key, iv)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
}
