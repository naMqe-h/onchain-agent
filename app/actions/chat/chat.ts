'use server'

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureChatModelAllowed, getEnabledModelCatalog } from "@/lib/modelCatalog"
import { clampToSupportedModelId } from "@/lib/modelPreferences"
import { DEFAULT_MODEL_ID, isSupportedModelId } from "@/lib/models"

export async function createChat(model?: string, userId?: string) {
    let resolvedUserId = userId
    if (!resolvedUserId) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')
        resolvedUserId = user.id
    }

    const safeModel = clampToSupportedModelId(model)

    const chat = await db.chat.create({
        data: {
            userId: resolvedUserId,
            model: safeModel
        }
    })
    return chat
}

export async function getUserChats(userId: string) {
    const chats = await db.chat.findMany({
        where: { userId, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { messages: true } }
        }
    })
    return chats
}

export async function getArchivedChats(userId: string) {
    const chats = await db.chat.findMany({
        where: { userId, isArchived: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        }
    })
    return chats
}

export async function getChatWithMessages(chatId: string, userId: string) {
    const chat = await db.chat.findFirst({
        where: { id: chatId, userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })
    return chat
}

export async function getChatWithMessagesAndResolvedModel(
    chatId: string,
    userId: string,
    defaultModelId: string
) {
    const chat = await getChatWithMessages(chatId, userId)
    if (!chat) return null

    const catalog = await getEnabledModelCatalog()
    const catalogIds = catalog.map((m) => m.id)
    const resolvedModel = await ensureChatModelAllowed(
        chat.id,
        chat.model,
        catalogIds,
        defaultModelId || DEFAULT_MODEL_ID
    )

    return { ...chat, model: resolvedModel }
}

async function getAuthenticatedUserAndChat(chatId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const chat = await db.chat.findFirst({ where: { id: chatId, userId: user.id } })
    if (!chat) throw new Error('Not found')

    return { user, chat }
}

export async function addMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    parts?: unknown
) {
    await getAuthenticatedUserAndChat(chatId)
    const message = await db.message.create({
        data: { chatId, role, content, parts: parts as any }
    })
    return message
}

export async function updateChatSession(
    chatId: string,
    eveSessionId: string,
    eveContinuationToken: string,
    eveStreamIndex: number
) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.update({
        where: { id: chatId },
        data: { eveSessionId, eveContinuationToken, eveStreamIndex, updatedAt: new Date() }
    })
}

export async function updateChatTitle(chatId: string, title: string) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.update({
        where: { id: chatId },
        data: { title }
    })
    revalidatePath('/')
}

export async function archiveChat(chatId: string) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.update({
        where: { id: chatId },
        data: { isArchived: true }
    })
    revalidatePath('/')
}

export async function restoreChat(chatId: string) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.update({
        where: { id: chatId },
        data: { isArchived: false }
    })
    revalidatePath('/')
}

export async function deleteChat(chatId: string) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.delete({
        where: { id: chatId }
    })
    revalidatePath('/')
}

export async function updateChatModel(chatId: string, model: string) {
    await getAuthenticatedUserAndChat(chatId)
    if (!isSupportedModelId(model)) {
        throw new Error('Unsupported model')
    }
    await db.chat.update({
        where: { id: chatId },
        data: { model }
    })
    revalidatePath('/')
}

export type ChatSearchResult = {
    chatId: string
    title: string
    matchType: 'title' | 'message'
    snippet: string | null
}

function buildSnippet(content: string, query: string, radiusBefore = 40, radiusAfter = 60): string {
    const normalized = content.replace(/\s+/g, ' ').trim()
    if (!normalized) return ''

    const lowerContent = normalized.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerContent.indexOf(lowerQuery)

    if (index === -1) {
        return normalized.length > radiusBefore + radiusAfter
            ? `${normalized.slice(0, radiusBefore + radiusAfter)}…`
            : normalized
    }

    const start = Math.max(0, index - radiusBefore)
    const end = Math.min(normalized.length, index + query.length + radiusAfter)
    const prefix = start > 0 ? '…' : ''
    const suffix = end < normalized.length ? '…' : ''
    return `${prefix}${normalized.slice(start, end)}${suffix}`
}

export async function searchChats(query: string): Promise<ChatSearchResult[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const q = query.trim()
    if (q.length < 2) return []

    const chats = await db.chat.findMany({
        where: {
            userId: user.id,
            isArchived: false,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { messages: { some: { content: { contains: q, mode: 'insensitive' } } } },
            ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
            id: true,
            title: true,
            messages: {
                where: { content: { contains: q, mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { content: true },
            },
        },
    })

    return chats.map((chat) => {
        const matchingMessage = chat.messages[0]
        if (matchingMessage) {
            return {
                chatId: chat.id,
                title: chat.title,
                matchType: 'message' as const,
                snippet: buildSnippet(matchingMessage.content, q),
            }
        }
        return {
            chatId: chat.id,
            title: chat.title,
            matchType: 'title' as const,
            snippet: null,
        }
    })
}
