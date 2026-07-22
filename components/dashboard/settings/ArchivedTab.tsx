'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiArchive, FiRotateCcw, FiTrash2 } from 'react-icons/fi'
import {
    deleteChat,
    getArchivedChats,
    restoreChat,
} from '../../../app/actions/chat/chat'
import { getNetworkIconSrc, getNetworkShortLabel } from '../../../lib/web3/config'

interface ArchivedChat {
    id: string
    title: string
    network?: string
    createdAt: Date
    updatedAt: Date
}

interface ArchivedTabProps {
    user: User
}

export default function ArchivedTab({ user }: ArchivedTabProps) {
    const router = useRouter()
    const [chats, setChats] = useState<ArchivedChat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState<string | null>(null)
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null)

    const fetchArchived = async () => {
        setIsLoading(true)
        setError('')
        try {
            const data = await getArchivedChats(user.id)
            setChats(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to load archived chats'
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchArchived()
    }, [user.id])

    const formatCreatedAt = (date: Date) => {
        const d = new Date(date)
        return d.toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const handleRestore = async (chatId: string) => {
        if (busyId) return
        setBusyId(chatId)
        setError('')
        try {
            await restoreChat(chatId)
            setChats((prev) => prev.filter((c) => c.id !== chatId))
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to restore chat'
            setError(message)
        } finally {
            setBusyId(null)
        }
    }

    const handleDelete = async (chatId: string) => {
        if (busyId) return
        setBusyId(chatId)
        setError('')
        try {
            await deleteChat(chatId)
            setChats((prev) => prev.filter((c) => c.id !== chatId))
            setDeleteConfirmationId(null)
            router.refresh()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete chat'
            setError(message)
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Archived chats</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Restore chats to Recent or permanently delete them.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-2 pr-1">
                {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                        {error}
                    </p>
                )}

                {isLoading ? (
                    <p className="text-sm text-zinc-500 px-1">Loading archived chats…</p>
                ) : chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <FiArchive size={24} className="text-zinc-600" />
                        <p className="text-sm text-zinc-500">No archived chats</p>
                    </div>
                ) : (
                    chats.map((chat) => {
                        const isBusy = busyId === chat.id
                        return (
                            <div
                                key={chat.id}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-100 truncate font-medium">
                                        {chat.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5 min-w-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getNetworkIconSrc(chat.network)}
                                            alt={getNetworkShortLabel(chat.network)}
                                            title={getNetworkShortLabel(chat.network)}
                                            className="w-3.5 h-3.5 object-contain shrink-0 rounded-sm"
                                        />
                                        <span>Created {formatCreatedAt(chat.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        disabled={!!busyId}
                                        onClick={() => handleRestore(chat.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Restore"
                                    >
                                        <FiRotateCcw size={12} className={isBusy ? 'animate-spin' : ''} />
                                        Restore
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!!busyId}
                                        onClick={() => setDeleteConfirmationId(chat.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={12} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {deleteConfirmationId && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-zinc-100">Delete Chat</h3>
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to delete this chat? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmationId(null)}
                                disabled={!!busyId}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteConfirmationId)}
                                disabled={!!busyId}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
