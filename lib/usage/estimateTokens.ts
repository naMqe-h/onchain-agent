/**
 * Token estimation via js-tiktoken (OpenAI BPE), used when the provider does
 * not report usage. Prefer provider-reported usage when available.
 *
 * Encoding selection follows OpenAI / js-tiktoken model → encoding maps
 */

import {
    Tiktoken,
    getEncodingNameForModel,
    type TiktokenModel,
} from "js-tiktoken/lite"
import cl100k_base from "js-tiktoken/ranks/cl100k_base"
import o200k_base from "js-tiktoken/ranks/o200k_base"

/** ChatML-style overhead tokens charged per message (role framing). */
export const OPENAI_TOKENS_PER_MESSAGE = 4

/** Reply priming token(s) OpenAI adds around the assistant turn. */
export const OPENAI_REPLY_PRIMING_TOKENS = 3

export type TiktokenEncodingName = "o200k_base" | "cl100k_base"

const encoderCache = new Map<TiktokenEncodingName, Tiktoken>()

function getEncoder(encoding: TiktokenEncodingName): Tiktoken {
    let enc = encoderCache.get(encoding)
    if (!enc) {
        enc = new Tiktoken(encoding === "cl100k_base" ? cl100k_base : o200k_base)
        encoderCache.set(encoding, enc)
    }
    return enc
}

/**
 * Resolve BPE encoding for a catalog / API model id.
 * - gpt-4.1-nano → o200k_base
 * - gpt-4 / gpt-3.5 family → cl100k_base
 */
export function resolveEncodingForModel(modelId: string): TiktokenEncodingName {
    const raw = (modelId || "").trim()
    if (!raw) return "o200k_base"

    // Strip OpenRouter-style prefixes/suffixes
    const cleaned = raw
        .replace(/^openai\//i, "")
        .replace(/:.*$/, "")
        .trim()

    try {
        const name = getEncodingNameForModel(cleaned as TiktokenModel)
        if (name === "cl100k_base" || name === "o200k_base") return name
        // Older encodings (gpt2, p50k, ...) — map to closest common chat encoding.
        if (name === "p50k_base" || name === "p50k_edit" || name === "r50k_base" || name === "gpt2") {
            return "cl100k_base"
        }
    } catch {
        // not in js-tiktoken model table
    }

    const id = cleaned.toLowerCase()

    // Heuristics for ids not yet in getEncodingNameForModel
    if (
        id.includes("gpt-4.1") ||
        id.includes("gpt-4o") ||
        id.includes("gpt-5") ||
        id.startsWith("o1") ||
        id.startsWith("o3") ||
        id.startsWith("o4") ||
        id.includes("gpt-oss")
    ) {
        return "o200k_base"
    }

    if (id.includes("gpt-4") || id.includes("gpt-3.5") || id.includes("gpt-35")) {
        return "cl100k_base"
    }

    // o200k is a stable estimate fallback.
    return "o200k_base"
}

/**
 * Base tokens for system prompt + tool schemas the agent always sends.
 */
export function getBaseInputOverheadTokens(): number {
    const raw = process.env.USAGE_ESTIMATE_BASE_INPUT_TOKENS
    if (raw) {
        const n = parseInt(raw, 10)
        if (Number.isFinite(n) && n >= 0) return n
    }
    return 1_000
}

/**
 * Count tokens for plain text with the encoding appropriate for `modelId`.
 */
export function estimateTokensFromText(text: string, modelId?: string): number {
    if (!text) return 0
    try {
        const encoding = resolveEncodingForModel(modelId ?? "")
        const tokens = getEncoder(encoding).encode(text)
        return tokens.length
    } catch (err) {
        console.warn("[estimateTokens] tiktoken encode failed, using char heuristic:", err)
        return Math.max(0, Math.ceil(text.length / 4))
    }
}

export function estimateTokensFromParts(
    parts: Array<{ type?: string; text?: string } | null | undefined> | null | undefined,
    modelId?: string
): number {
    if (!parts?.length) return 0
    let total = 0
    for (const p of parts) {
        if (p && typeof p.text === "string") {
            total += estimateTokensFromText(p.text, modelId)
        }
    }
    return total
}

export type ChatMessageLike = {
    role?: string
    content?: string | null
    parts?: unknown
}

/**
 * Extract plain text from a stored chat message (content + text parts).
 */
export function textFromStoredMessage(message: ChatMessageLike): string {
    const chunks: string[] = []
    if (typeof message.content === "string" && message.content.trim()) {
        chunks.push(message.content)
    }
    if (Array.isArray(message.parts)) {
        for (const part of message.parts as Array<Record<string, unknown>>) {
            if (!part || typeof part !== "object") continue
            if (part.type === "text" && typeof part.text === "string") {
                chunks.push(part.text)
            }
            if (part.type === "dynamic-tool") {
                if (typeof part.input === "object" && part.input) {
                    try {
                        chunks.push(JSON.stringify(part.input))
                    } catch {
                        /* ignore */
                    }
                }
                if (part.state === "output-available" && part.output != null) {
                    try {
                        chunks.push(JSON.stringify(part.output))
                    } catch {
                        /* ignore */
                    }
                }
            }
        }
    }
    return chunks.join("\n")
}

/**
 * Estimate input tokens for a chat completion request given prior messages
 * (history the model will see) using tiktoken + ChatML framing heuristics.
 */
export function estimateInputTokensFromMessages(
    messages: ChatMessageLike[],
    options?: { baseOverheadTokens?: number; modelId?: string }
): number {
    const base = options?.baseOverheadTokens ?? getBaseInputOverheadTokens()
    const modelId = options?.modelId
    let total = base + OPENAI_REPLY_PRIMING_TOKENS

    for (const msg of messages) {
        const text = textFromStoredMessage(msg)
        total += OPENAI_TOKENS_PER_MESSAGE
        total += estimateTokensFromText(text, modelId)
        if (msg.role) {
            total += estimateTokensFromText(String(msg.role), modelId)
        }
    }

    return Math.max(0, total)
}

/**
 * Estimate output tokens for assistant text (+ optional reasoning / tool JSON).
 */
export function estimateOutputTokens(
    parts: {
        messageText?: string | null
        reasoningText?: string | null
        toolJson?: string | null
    },
    modelId?: string
): number {
    let total = 0
    if (parts.messageText) total += estimateTokensFromText(parts.messageText, modelId)
    if (parts.reasoningText) total += estimateTokensFromText(parts.reasoningText, modelId)
    if (parts.toolJson) total += estimateTokensFromText(parts.toolJson, modelId)
    return total
}
