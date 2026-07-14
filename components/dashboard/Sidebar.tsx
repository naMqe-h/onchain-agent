'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { FiPlus, FiMessageSquare } from 'react-icons/fi'
import SidebarProfile from './SidebarProfile'
import { createChat } from '../../app/actions/chat/chat'

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
}

export default function Sidebar({ user, chats }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isCreating, setIsCreating] = useState(false)

    const handleNewChat = async () => {
        if (!user || isCreating) return
        setIsCreating(true)
        try {
            const chat = await createChat(user.id)
            router.push(`/chat/${chat.id}`)
        } finally {
            setIsCreating(false)
        }
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

    return (
        <div className="w-64 h-screen border-r border-white/5 bg-[#131314] flex flex-col">
            <div className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Robinhood Agent</span>
                </div>

                <button
                    onClick={handleNewChat}
                    disabled={isCreating}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                    <span>{isCreating ? 'Creating...' : 'New Chat'}</span>
                </button>

                {chats.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">Recent</p>
                        {chats.map((chat) => {
                            const isActive = pathname === `/chat/${chat.id}`
                            return (
                                <Link
                                    key={chat.id}
                                    href={`/chat/${chat.id}`}
                                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                                        isActive
                                            ? 'bg-white/8 text-zinc-100'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                    }`}
                                >
                                    <FiMessageSquare size={14} className="shrink-0 mt-0.5 opacity-60" />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate leading-tight">{chat.title}</p>
                                        <p className="text-[11px] text-zinc-600 mt-0.5">{formatDate(chat.updatedAt)}</p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            <SidebarProfile user={user} />
        </div>
    )
}
