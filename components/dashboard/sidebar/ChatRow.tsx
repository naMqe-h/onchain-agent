'use client'

import Link from 'next/link'
import { FiStar, FiMessageSquare, FiMoreVertical } from 'react-icons/fi'
import { formatRelativeTime } from '../../../lib/format'

interface Chat {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    isPinned: boolean
    pinnedAt: Date | null
    folderId: string | null
    _count: { messages: number }
}

interface ChatRowProps {
    chat: Chat
    pathname: string
    showPinIcon?: boolean
    inFolder?: boolean
    editingChatId: string | null
    editTitle: string
    activeDropdownId: string | null
    onSetEditTitle: (val: string) => void
    onSetEditingChatId: (val: string | null) => void
    onRenameSubmit: (chatId: string) => Promise<void>
    onOpenChatMenu: (chatId: string, anchorEl: HTMLElement) => void
    onCloseMobileMenu: () => void
}

export default function ChatRow({
    chat,
    pathname,
    showPinIcon: customShowPinIcon,
    inFolder = false,
    editingChatId,
    editTitle,
    activeDropdownId,
    onSetEditTitle,
    onSetEditingChatId,
    onRenameSubmit,
    onOpenChatMenu,
    onCloseMobileMenu,
}: ChatRowProps) {
    const isActive = pathname === `/chat/${chat.id}`
    const showPinIcon = customShowPinIcon ?? chat.isPinned

    return (
        <div className={`relative ${inFolder ? 'pl-0' : ''}`}>
            <div
                className={`flex items-center gap-2 rounded-xl text-sm transition-all group ${
                    inFolder ? 'gap-2 px-2.5 py-2' : 'gap-2.5 px-3 py-2.5'
                } ${
                    isActive
                        ? 'bg-white/8 text-zinc-100'
                        : inFolder
                            ? 'text-zinc-400 hover:bg-white/4 hover:text-zinc-200'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
            >
                <Link
                    href={`/chat/${chat.id}`}
                    onClick={onCloseMobileMenu}
                    className="flex-1 min-w-0 flex items-start gap-2"
                >
                    {showPinIcon ? (
                        <FiStar size={14} className="shrink-0 mt-0.5 text-amber-400/90" />
                    ) : inFolder ? (
                        <span
                            className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-zinc-300' : 'bg-zinc-600 group-hover:bg-zinc-500'
                            }`}
                            aria-hidden
                        />
                    ) : (
                        <FiMessageSquare size={14} className="shrink-0 mt-0.5 opacity-60" />
                    )}
                    <div className="flex-1 min-w-0">
                        {editingChatId === chat.id ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => onSetEditTitle(e.target.value)}
                                onBlur={() => onRenameSubmit(chat.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onRenameSubmit(chat.id)
                                    if (e.key === 'Escape') onSetEditingChatId(null)
                                }}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none text-zinc-100 p-0 m-0 text-sm leading-tight focus:ring-0"
                                onClick={(e) => e.preventDefault()}
                            />
                        ) : (
                            <p className="truncate leading-tight">{chat.title}</p>
                        )}
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                            {formatRelativeTime(chat.updatedAt)}
                        </p>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onOpenChatMenu(chat.id, e.currentTarget)
                    }}
                    className={`p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ${
                        activeDropdownId === chat.id
                            ? 'opacity-100'
                            : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                    }`}
                >
                    <FiMoreVertical size={14} />
                </button>
            </div>
        </div>
    )
}
