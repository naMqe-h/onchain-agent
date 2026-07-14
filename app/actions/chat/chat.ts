'use server'

import db from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createChat(userId: string) {
    const chat = await db.chat.create({
        data: { userId }
    })
    revalidatePath('/')
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

export async function addMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    parts?: unknown
) {
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
    await db.chat.update({
        where: { id: chatId },
        data: { eveSessionId, eveContinuationToken, eveStreamIndex, updatedAt: new Date() }
    })
}

export async function updateChatTitle(chatId: string, title: string) {
    await db.chat.update({
        where: { id: chatId },
        data: { title }
    })
    revalidatePath('/')
}

export async function archiveChat(chatId: string) {
    await db.chat.update({
        where: { id: chatId },
        data: { isArchived: true }
    })
    revalidatePath('/')
}

export async function deleteChat(chatId: string) {
    await db.chat.delete({
        where: { id: chatId }
    })
    revalidatePath('/')
}
