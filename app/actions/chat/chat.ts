'use server'

import db from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { ensureChatModelAllowed, getEnabledModelCatalog } from "@/lib/modelCatalog"
import { clampToSupportedModelId } from "@/lib/modelPreferences"
import { DEFAULT_MODEL_ID, isSupportedModelId } from "@/lib/models"
import { normalizeNetworkId } from "@/lib/web3/config"
import type { ChatSearchResult } from "@/types"

export async function createChat(model?: string, network?: string, userId?: string) {
    let resolvedUserId = userId
    let defaultNetworkFromUser = network

    if (!resolvedUserId || !defaultNetworkFromUser) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')
        resolvedUserId = user.id
        if (!defaultNetworkFromUser) {
            defaultNetworkFromUser = user.user_metadata?.defaultNetwork || user.user_metadata?.activeNetwork
        }
    }

    const safeModel = clampToSupportedModelId(model)
    const safeNetwork = normalizeNetworkId(defaultNetworkFromUser)

    const chat = await db.chat.create({
        data: {
            userId: resolvedUserId,
            model: safeModel,
            network: safeNetwork,
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
            isPinned: true,
            pinnedAt: true,
            folderId: true,
            network: true,
            hasUnread: true,
            _count: { select: { messages: true } }
        }
    })
    return chats
}

export async function getUserFolders(userId: string) {
    return db.chatFolder.findMany({
        where: { userId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
            id: true,
            name: true,
            sortOrder: true,
        },
    })
}

export async function getArchivedChats(userId: string) {
    const chats = await db.chat.findMany({
        where: { userId, isArchived: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            network: true,
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

    return { ...chat, model: resolvedModel, network: normalizeNetworkId(chat.network) }
}

const FOLDER_NAME_MAX = 40
const FOLDER_COUNT_MAX = 20

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return user
}

async function getAuthenticatedUserAndChat(chatId: string) {
    const user = await getAuthenticatedUser()

    const chat = await db.chat.findFirst({ where: { id: chatId, userId: user.id } })
    if (!chat) throw new Error('Not found')

    return { user, chat }
}

async function getAuthenticatedUserAndFolder(folderId: string) {
    const user = await getAuthenticatedUser()

    const folder = await db.chatFolder.findFirst({ where: { id: folderId, userId: user.id } })
    if (!folder) throw new Error('Not found')

    return { user, folder }
}

function normalizeFolderName(name: string): string {
    const trimmed = name.trim().replace(/\s+/g, ' ')
    if (!trimmed) throw new Error('Folder name is required')
    if (trimmed.length > FOLDER_NAME_MAX) {
        throw new Error(`Folder name must be at most ${FOLDER_NAME_MAX} characters`)
    }
    return trimmed
}

export async function addMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    parts?: unknown
) {
    await getAuthenticatedUserAndChat(chatId)
    const [message] = await db.$transaction([
        db.message.create({
            data: { chatId, role, content, parts: parts as any },
        }),
        db.chat.update({
            where: { id: chatId },
            data: {
                updatedAt: new Date(),
                ...(role === 'assistant' ? { hasUnread: true } : {})
            },
        }),
    ])
    return message
}

export async function markChatAsRead(chatId: string) {
    await getAuthenticatedUserAndChat(chatId)
    await db.chat.update({
        where: { id: chatId },
        data: { hasUnread: false }
    })
    revalidatePath('/')
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
        data: {
            eveSessionId,
            eveContinuationToken,
            eveStreamIndex,
            updatedAt: new Date(),
        },
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
        data: { isArchived: true, isPinned: false, pinnedAt: null }
    })
    revalidatePath('/')
}

export async function togglePinChat(chatId: string) {
    const { chat } = await getAuthenticatedUserAndChat(chatId)
    if (chat.isArchived) {
        throw new Error('Cannot pin an archived chat')
    }

    const nextPinned = !chat.isPinned
    await db.chat.update({
        where: { id: chatId },
        data: {
            isPinned: nextPinned,
            pinnedAt: nextPinned ? new Date() : null,
        },
    })
    revalidatePath('/')
    return { isPinned: nextPinned }
}

export async function createFolder(name: string) {
    const user = await getAuthenticatedUser()
    const folderName = normalizeFolderName(name)

    const count = await db.chatFolder.count({ where: { userId: user.id } })
    if (count >= FOLDER_COUNT_MAX) {
        throw new Error(`You can have at most ${FOLDER_COUNT_MAX} folders`)
    }

    const maxSort = await db.chatFolder.aggregate({
        where: { userId: user.id },
        _max: { sortOrder: true },
    })

    try {
        const folder = await db.chatFolder.create({
            data: {
                userId: user.id,
                name: folderName,
                sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            },
        })
        revalidatePath('/')
        return folder
    } catch (err: unknown) {
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code?: string }).code === 'P2002'
        ) {
            throw new Error('Folder already exists')
        }
        throw err
    }
}

export async function renameFolder(folderId: string, name: string) {
    await getAuthenticatedUserAndFolder(folderId)
    const folderName = normalizeFolderName(name)

    try {
        await db.chatFolder.update({
            where: { id: folderId },
            data: { name: folderName },
        })
        revalidatePath('/')
    } catch (err: unknown) {
        if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code?: string }).code === 'P2002'
        ) {
            throw new Error('Folder already exists')
        }
        throw err
    }
}

export async function deleteFolder(folderId: string) {
    await getAuthenticatedUserAndFolder(folderId)

    await db.$transaction([
        db.chat.updateMany({
            where: { folderId },
            data: { folderId: null },
        }),
        db.chatFolder.delete({ where: { id: folderId } }),
    ])
    revalidatePath('/')
}

export async function moveChatToFolder(chatId: string, folderId: string | null) {
    const { user } = await getAuthenticatedUserAndChat(chatId)

    if (folderId) {
        const folder = await db.chatFolder.findFirst({
            where: { id: folderId, userId: user.id },
        })
        if (!folder) throw new Error('Not found')
    }

    await db.chat.update({
        where: { id: chatId },
        data: { folderId },
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

export async function updateChatNetwork(chatId: string, network: string) {
    await getAuthenticatedUserAndChat(chatId)
    const safeNetwork = normalizeNetworkId(network)
    await db.chat.update({
        where: { id: chatId },
        data: { network: safeNetwork }
    })
    revalidatePath('/')
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
