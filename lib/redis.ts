import { Redis } from '@upstash/redis'

function getRedisCredentials(): { url: string; token: string } | null {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
        try {
            const parsed = new URL(redisUrl)
            const host = parsed.hostname
            const password = parsed.password
            if (host && password) {
                return {
                    url: `https://${host}`,
                    token: password,
                }
            }
        } catch { }
    }

    const directUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    const directToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

    if (directUrl && directToken) {
        return { url: directUrl, token: directToken }
    }

    return null
}

const creds = getRedisCredentials()
export const redis = creds ? new Redis({ url: creds.url, token: creds.token }) : null

export async function getCache<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
        return await redis.get<T>(key)
    } catch {
        return null
    }
}

export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!redis) return
    try {
        await redis.set(key, value, { ex: ttlSeconds })
    } catch { }
}
