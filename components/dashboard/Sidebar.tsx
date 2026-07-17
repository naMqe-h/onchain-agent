'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { FiPlus, FiMessageSquare, FiMoreVertical, FiEdit2, FiArchive, FiTrash2, FiMenu, FiX, FiLogIn } from 'react-icons/fi'
import SidebarProfile from './SidebarProfile'
import { updateChatTitle, archiveChat, deleteChat } from '../../app/actions/chat/chat'
import { PublicProfile } from '../../app/actions/profile/profile'
import { motion, AnimatePresence } from 'framer-motion'
import { slideInLeft } from '../../lib/motion'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'

interface Chat {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    _count: { messages: number }
}

interface SidebarProps {
    user: User | null
    chats: Chat[]
    profile: PublicProfile | null
}

export default function Sidebar({ user, chats, profile }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
    const [editingChatId, setEditingChatId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null)
    const openAuthModal = useAuthModalStore(s => s.open)

    const handleNewChat = () => {
        setIsMobileMenuOpen(false)
        router.push('/')
    }

    const formatDate = (date: Date) => {
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days}d ago`
        return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    }

    const handleRenameSubmit = async (chatId: string) => {
        if (!editTitle.trim()) {
            setEditingChatId(null)
            return
        }
        await updateChatTitle(chatId, editTitle)
        setEditingChatId(null)
        router.refresh()
    }

    const handleArchive = async (chatId: string) => {
        await archiveChat(chatId)
        setActiveDropdownId(null)
        setIsMobileMenuOpen(false)
        router.refresh()
        if (pathname === `/chat/${chatId}`) {
            router.push('/')
        }
    }

    const handleDelete = async (chatId: string) => {
        await deleteChat(chatId)
        setActiveDropdownId(null)
        setDeleteConfirmationId(null)
        setIsMobileMenuOpen(false)
        router.refresh()
        if (pathname === `/chat/${chatId}`) {
            router.push('/')
        }
    }

    const renderSidebarContent = () => (
        <>
            <div className="px-4 pt-6 pb-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Onchain Agent</span>
                </div>

                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer group"
                >
                    <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                    <span>New Chat</span>
                </button>
            </div>

            <div className="flex-1 px-4 pb-6 overflow-y-auto flex flex-col min-h-0">
                {user && chats.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">Recent</p>
                        {chats.map((chat) => {
                            const isActive = pathname === `/chat/${chat.id}`
                            return (
                                <div key={chat.id} className="relative">
                                    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive
                                        ? 'bg-white/8 text-zinc-100'
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                        }`}>
                                        <Link
                                            href={`/chat/${chat.id}`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex-1 min-w-0 flex items-start gap-2.5"
                                        >
                                            <FiMessageSquare size={14} className="shrink-0 mt-0.5 opacity-60" />
                                            <div className="flex-1 min-w-0">
                                                {editingChatId === chat.id ? (
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onBlur={() => handleRenameSubmit(chat.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRenameSubmit(chat.id)
                                                            if (e.key === 'Escape') setEditingChatId(null)
                                                        }}
                                                        autoFocus
                                                        className="w-full bg-transparent border-none outline-none text-zinc-100 p-0 m-0 text-sm leading-tight focus:ring-0"
                                                        onClick={(e) => e.preventDefault()}
                                                    />
                                                ) : (
                                                    <p className="truncate leading-tight">{chat.title}</p>
                                                )}
                                                <p className="text-[11px] text-zinc-600 mt-0.5">{formatDate(chat.updatedAt)}</p>
                                            </div>
                                        </Link>

                                        <button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setActiveDropdownId(activeDropdownId === chat.id ? null : chat.id)
                                            }}
                                            className={`p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ${activeDropdownId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <FiMoreVertical size={14} />
                                        </button>
                                    </div>

                                    {activeDropdownId === chat.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                            <div className="absolute right-0 top-10 w-36 bg-[#1f1f22] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                                <button
                                                    onClick={() => {
                                                        setEditTitle(chat.title)
                                                        setEditingChatId(chat.id)
                                                        setActiveDropdownId(null)
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FiEdit2 size={12} />
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => handleArchive(chat.id)}
                                                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FiArchive size={12} />
                                                    Archive
                                                </button>
                                                <div className="h-px bg-white/5 my-1" />
                                                <button
                                                    onClick={() => {
                                                        setDeleteConfirmationId(chat.id)
                                                        setActiveDropdownId(null)
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                    <FiTrash2 size={12} />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {user ? (
                <SidebarProfile user={user} profile={profile} />
            ) : (
                <div className="px-3 pb-4">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false)
                            openAuthModal()
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer group text-zinc-400 hover:text-zinc-100"
                    >
                        <FiLogIn size={16} className="shrink-0" />
                        <span className="text-sm font-medium">Sign In</span>
                    </button>
                </div>
            )}
        </>
    )

    return (
        <>
            <div className="flex md:hidden h-14 border-b border-white/5 bg-[#131314] items-center justify-between px-4 w-full shrink-0">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                    <FiMenu size={20} />
                </button>
                <span className="font-medium text-[16px] text-zinc-100 tracking-tight">Onchain Agent</span>
                <button
                    onClick={handleNewChat}
                    className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                    <FiPlus size={20} />
                </button>
            </div>

            <motion.div
                variants={slideInLeft}
                initial="initial"
                animate="animate"
                className="hidden md:flex w-56 lg:w-64 h-screen border-r border-white/5 bg-[#131314] flex-col shrink-0"
            >
                {renderSidebarContent()}
            </motion.div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        variants={slideInLeft}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed inset-0 z-50 bg-[#131314] flex flex-col h-full w-full"
                    >
                        <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#131314] shrink-0">
                            <span className="font-medium text-[16px] text-zinc-100 tracking-tight">Onchain Agent</span>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        {renderSidebarContent()}
                    </motion.div>
                )}
            </AnimatePresence>

            {deleteConfirmationId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-zinc-100">Delete Chat</h3>
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to delete this chat? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                onClick={() => setDeleteConfirmationId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmationId)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
