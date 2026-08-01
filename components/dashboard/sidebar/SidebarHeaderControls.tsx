'use client'

import { User } from '@supabase/supabase-js'
import { FiPlus, FiSearch, FiChevronsLeft, FiChevronsRight, FiMessageSquare } from 'react-icons/fi'

interface SidebarHeaderControlsProps {
    collapsed: boolean
    user: User | null
    unreadCount?: number
    hideTitleRow?: boolean
    onToggleCollapse: () => void
    onNewChat: () => void
    onOpenSearch: () => void
}

export default function SidebarHeaderControls({
    collapsed,
    user,
    unreadCount = 0,
    hideTitleRow = false,
    onToggleCollapse,
    onNewChat,
    onOpenSearch,
}: SidebarHeaderControlsProps) {
    if (collapsed) {
        return (
            <div className="pt-4 pb-3 flex flex-col items-center gap-2 shrink-0">
                <div className="p-1 mb-1" title="Onchain Agent">
                    <img
                        src="/logo.png"
                        alt="Onchain Agent Logo"
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-lg object-contain shrink-0"
                    />
                </div>
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                >
                    <FiChevronsRight size={18} />
                </button>
                <button
                    type="button"
                    onClick={onNewChat}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer group"
                    aria-label="New Chat"
                    title="New Chat"
                >
                    <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                </button>
                {user && (
                    <>
                        <button
                            type="button"
                            onClick={onOpenSearch}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                            aria-label="Search chats"
                            title="Search chats"
                        >
                            <FiSearch size={16} className="shrink-0" />
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={onToggleCollapse}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer relative"
                                aria-label="Chats"
                                title={unreadCount > 0 ? `${unreadCount} unread chats` : 'Chats'}
                            >
                                <FiMessageSquare size={16} className="shrink-0" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className={`px-4 ${hideTitleRow ? 'pt-4' : 'pt-6'} pb-4 flex flex-col gap-4`}>
            {!hideTitleRow && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/logo.png"
                            alt="Onchain Agent Logo"
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-lg object-contain shrink-0"
                        />
                        <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Onchain Agent</span>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="p-1.5 -mr-1 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                        aria-label="Collapse sidebar"
                        title="Collapse sidebar"
                    >
                        <FiChevronsLeft size={16} />
                    </button>
                </div>
            )}

            <button
                type="button"
                data-tour="new-chat-button"
                onClick={onNewChat}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer group"
            >
                <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Chat</span>
            </button>
            {user && (
                <button
                    type="button"
                    data-tour="search-chats"
                    onClick={onOpenSearch}
                    className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-2">
                        <FiSearch size={16} className="shrink-0" />
                        <span>Search & Commands</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-white/5 border border-white/10 rounded-md group-hover:border-white/20">
                        Ctrl+K
                    </kbd>
                </button>
            )}
        </div>
    )
}


