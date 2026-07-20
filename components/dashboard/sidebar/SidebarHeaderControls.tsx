'use client'

import { User } from '@supabase/supabase-js'
import { FiPlus, FiSearch, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'

interface SidebarHeaderControlsProps {
    collapsed: boolean
    user: User | null
    onToggleCollapse: () => void
    onNewChat: () => void
    onOpenSearch: () => void
}

export default function SidebarHeaderControls({
    collapsed,
    user,
    onToggleCollapse,
    onNewChat,
    onOpenSearch,
}: SidebarHeaderControlsProps) {
    if (collapsed) {
        return (
            <div className="pt-4 pb-3 flex flex-col items-center gap-2 shrink-0">
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
                    <button
                        type="button"
                        onClick={onOpenSearch}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                        aria-label="Search chats"
                        title="Search chats"
                    >
                        <FiSearch size={16} className="shrink-0" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="px-4 pt-6 pb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
                <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Onchain Agent</span>
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

            <button
                type="button"
                onClick={onNewChat}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer group"
            >
                <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                <span>New Chat</span>
            </button>
            {user && (
                <button
                    type="button"
                    onClick={onOpenSearch}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer"
                >
                    <FiSearch size={16} className="shrink-0" />
                    <span>Search chats</span>
                </button>
            )}
        </div>
    )
}
