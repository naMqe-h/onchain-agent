function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (!raw) return fallback
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 0) return fallback
    return n
}

function parseRatio(raw: string | undefined, fallback: number): number {
    if (!raw) return fallback
    const n = parseFloat(raw)
    if (!Number.isFinite(n) || n <= 0 || n > 1) return fallback
    return n
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
    if (raw === undefined || raw === "") return fallback
    const v = raw.trim().toLowerCase()
    if (v === "1" || v === "true" || v === "yes" || v === "on") return true
    if (v === "0" || v === "false" || v === "no" || v === "off") return false
    return fallback
}

export type UsageConfig = {
    enforce: boolean
    estimateWhenMissing: boolean
    llmRequestsPerMinute: number
    llmRequestsPerDay: number
    llmTokensPerDay: number
    llmTokensSoftRatio: number
}

export function getUsageConfig(): UsageConfig {
    return {
        enforce: parseBool(process.env.USAGE_ENFORCE, true),
        estimateWhenMissing: parseBool(process.env.USAGE_ESTIMATE_WHEN_MISSING, true),
        llmRequestsPerMinute: parsePositiveInt(process.env.USAGE_LLM_REQUESTS_PER_MINUTE, 20),
        llmRequestsPerDay: parsePositiveInt(process.env.USAGE_LLM_REQUESTS_PER_DAY, 200),
        llmTokensPerDay: parsePositiveInt(process.env.USAGE_LLM_TOKENS_PER_DAY, 500_000),
        llmTokensSoftRatio: parseRatio(process.env.USAGE_LLM_TOKENS_SOFT_RATIO, 0.8),
    }
}
