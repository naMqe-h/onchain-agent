import { defineHook } from "eve/hooks"
import db from "../../lib/db"
import { type SupportedModelId, type LlmUsageSource } from "@/types"
import { DEFAULT_MODEL_ID, SUPPORTED_MODELS } from "../../lib/models"
import { getUsageConfig } from "../../lib/usage/config"
import {
  estimateInputTokensFromMessages,
  estimateOutputTokens,
} from "../../lib/usage/estimateTokens"
import { recordLlmUsage } from "../../lib/usage/recordLlm"

type StepTextBuffer = {
  messageText: string
  reasoningText: string
  toolJson: string
}

const stepTextBuffers = new Map<string, StepTextBuffer>()

function stepBufferKey(sessionId: string, turnId: string, stepIndex: number): string {
  return `${sessionId}:${turnId}:${stepIndex}`
}

function getStepBuffer(sessionId: string, turnId: string, stepIndex: number): StepTextBuffer {
  const key = stepBufferKey(sessionId, turnId, stepIndex)
  let buf = stepTextBuffers.get(key)
  if (!buf) {
    buf = { messageText: "", reasoningText: "", toolJson: "" }
    stepTextBuffers.set(key, buf)
  }
  return buf
}

function takeStepBuffer(sessionId: string, turnId: string, stepIndex: number): StepTextBuffer {
  const key = stepBufferKey(sessionId, turnId, stepIndex)
  const buf = stepTextBuffers.get(key) ?? {
    messageText: "",
    reasoningText: "",
    toolJson: "",
  }
  stepTextBuffers.delete(key)
  return buf
}

function attrString(
  attributes: Record<string, string | string[] | undefined> | undefined,
  key: string
): string {
  const v = attributes?.[key]
  if (typeof v === "string") return v
  if (Array.isArray(v) && typeof v[0] === "string") return v[0]
  return ""
}

function resolveModelAndProvider(modelName: string): {
  model: string
  provider: string
} {
  if (modelName && modelName in SUPPORTED_MODELS) {
    const id = modelName as SupportedModelId
    const cfg = SUPPORTED_MODELS[id]
    return { model: id, provider: cfg.provider }
  }
  return {
    model: modelName || "unknown",
    provider: "unknown",
  }
}

function hasProviderUsage(usage: {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
} | undefined): boolean {
  if (!usage) return false
  return (
    typeof usage.inputTokens === "number" ||
    typeof usage.outputTokens === "number" ||
    typeof usage.cacheReadTokens === "number" ||
    typeof usage.cacheWriteTokens === "number"
  )
}

async function resolveModelName(
  headerModel: string,
  chatId: string | null,
  eveSessionId: string | undefined
): Promise<string> {
  if (headerModel && headerModel in SUPPORTED_MODELS) return headerModel

  if (chatId) {
    const chat = await db.chat.findFirst({
      where: { id: chatId },
      select: { model: true },
    })
    if (chat?.model) return chat.model
  }

  if (eveSessionId) {
    const chat = await db.chat.findFirst({
      where: { eveSessionId },
      select: { model: true },
    })
    if (chat?.model) return chat.model
  }

  return headerModel || DEFAULT_MODEL_ID
}

async function estimateStepTokens(params: {
  chatId: string | null
  modelId: string
  messageText: string
  reasoningText: string
  toolJson: string
}): Promise<{ inputTokens: number; outputTokens: number }> {
  const outputTokens = estimateOutputTokens(
    {
      messageText: params.messageText,
      reasoningText: params.reasoningText,
      toolJson: params.toolJson,
    },
    params.modelId
  )

  let inputTokens = 0
  if (params.chatId) {
    const messages = await db.message.findMany({
      where: { chatId: params.chatId },
      orderBy: { createdAt: "asc" },
      take: 80,
      select: {
        role: true,
        content: true,
        parts: true,
      },
    })
    inputTokens = estimateInputTokensFromMessages(messages, { modelId: params.modelId })
  } else {
    inputTokens = estimateInputTokensFromMessages([], { modelId: params.modelId })
  }

  if (inputTokens === 0 && outputTokens === 0) {
    inputTokens = estimateInputTokensFromMessages([], { modelId: params.modelId })
  }

  return { inputTokens, outputTokens }
}

export default defineHook({
  events: {
    async "message.completed"(event, ctx) {
      try {
        const sessionId = ctx.session?.id
        const turnId = event.data?.turnId
        const stepIndex = event.data?.stepIndex
        if (!sessionId || typeof turnId !== "string" || typeof stepIndex !== "number") return
        const text = event.data?.message
        if (typeof text === "string" && text) {
          const buf = getStepBuffer(sessionId, turnId, stepIndex)
          buf.messageText = buf.messageText ? `${buf.messageText}\n${text}` : text
        }
      } catch (err) {
        console.error("[usage hook] message.completed buffer failed:", err)
      }
    },

    async "reasoning.completed"(event, ctx) {
      try {
        const sessionId = ctx.session?.id
        const turnId = event.data?.turnId
        const stepIndex = event.data?.stepIndex
        if (!sessionId || typeof turnId !== "string" || typeof stepIndex !== "number") return
        const text = event.data?.reasoning
        if (typeof text === "string" && text) {
          const buf = getStepBuffer(sessionId, turnId, stepIndex)
          buf.reasoningText = buf.reasoningText ? `${buf.reasoningText}\n${text}` : text
        }
      } catch (err) {
        console.error("[usage hook] reasoning.completed buffer failed:", err)
      }
    },

    async "actions.requested"(event, ctx) {
      try {
        const sessionId = ctx.session?.id
        const turnId = event.data?.turnId
        const stepIndex = event.data?.stepIndex
        const actions = event.data?.actions
        if (
          !sessionId ||
          typeof turnId !== "string" ||
          typeof stepIndex !== "number" ||
          !Array.isArray(actions) ||
          actions.length === 0
        ) {
          return
        }

        for (const action of actions as Array<Record<string, unknown>>) {
          try {
            const payload = JSON.stringify({
              name: action.name ?? action.toolName,
              input: action.input ?? action.arguments ?? action.params,
            })
            const buf = getStepBuffer(sessionId, turnId, stepIndex)
            buf.toolJson = buf.toolJson ? `${buf.toolJson}\n${payload}` : payload
          } catch { }
        }
      } catch (err) {
        console.error("[usage hook] actions.requested buffer failed:", err)
      }
    },

    async "step.completed"(event, ctx) {
      try {
        const principalId = ctx.session?.auth?.current?.principalId
        if (!principalId || principalId === "local-dev") return

        const attributes = ctx.session?.auth?.current?.attributes as
          | Record<string, string | string[] | undefined>
          | undefined
        const chatId = attrString(attributes, "chatId") || null
        const headerModel = attrString(attributes, "modelName")
        const timeZone = attrString(attributes, "timeZone") || null
        const modelName = await resolveModelName(headerModel, chatId, ctx.session?.id)
        const { model, provider } = resolveModelAndProvider(modelName)

        const usage = event.data?.usage
        const config = getUsageConfig()
        let source: LlmUsageSource = "missing"
        let inputTokens = 0
        let outputTokens = 0
        let cacheReadTokens = 0
        let cacheWriteTokens = 0

        const sessionId = ctx.session?.id ?? ""
        const turnId = event.data?.turnId ?? ""
        const stepIndex = event.data?.stepIndex
        const buf =
          sessionId && turnId && typeof stepIndex === "number"
            ? takeStepBuffer(sessionId, turnId, stepIndex)
            : { messageText: "", reasoningText: "", toolJson: "" }

        if (hasProviderUsage(usage)) {
          source = "provider"
          inputTokens = usage?.inputTokens ?? 0
          outputTokens = usage?.outputTokens ?? 0
          cacheReadTokens = usage?.cacheReadTokens ?? 0
          cacheWriteTokens = usage?.cacheWriteTokens ?? 0
        } else if (config.estimateWhenMissing) {
          const estimated = await estimateStepTokens({
            chatId,
            modelId: model,
            messageText: buf.messageText,
            reasoningText: buf.reasoningText,
            toolJson: buf.toolJson,
          })
          source = "estimated"
          inputTokens = estimated.inputTokens
          outputTokens = estimated.outputTokens
        }

        await recordLlmUsage({
          userId: principalId,
          chatId,
          eveSessionId: ctx.session?.id ?? null,
          model,
          provider,
          stepIndex: event.data?.stepIndex,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheWriteTokens,
          source,
          timeZone,
        })
      } catch (err) {
        console.error("[usage hook] failed to record LLM usage:", err)
      }
    },
  },
})
