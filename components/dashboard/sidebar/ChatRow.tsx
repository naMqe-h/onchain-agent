'use client'

import Link from 'next/link'
import { FiStar, FiMessageSquare, FiMoreVertical } from 'react-icons/fi'
import { formatRelativeTime } from '../../../lib/format'
import { getNetworkIconSrc, getNetworkShortLabel } from '../../../lib/web3/config'
import { useChatActivityStore } from '../../../hooks/useChatActivityStore'
import { useModelsStore } from '../../../hooks/useModelsStore'
import { type Chat } from '@/types'

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
    const isRunning = useChatActivityStore((s) => s.runningChats[chat.id])
    const hasUnread = !isActive && chat.hasUnread
    const catalog = useModelsStore((s) => s.models)
    const modelInfo = catalog.find((m) => m.id === chat.model)

    return (
        <div className={`relative ${inFolder ? 'pl-0' : ''}`}>
            <div
                className={`flex items-center gap-2 rounded-xl text-sm transition-all group ${inFolder ? 'gap-2 px-2.5 py-2' : 'gap-2.5 px-3 py-2.5'
                    } ${isActive
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
                            className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-zinc-300' : 'bg-zinc-600 group-hover:bg-zinc-500'
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
                            <p className={`truncate leading-tight ${hasUnread ? 'font-semibold text-zinc-100' : ''}`}>
                                {chat.title}
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 mt-0.5 min-w-0">
                            {modelInfo?.icon ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={`/models/${modelInfo.icon}`}
                                    alt={modelInfo.shortName || chat.model}
                                    title={modelInfo.name || chat.model}
                                    className="w-3 h-3 object-contain shrink-0"
                                />
                            ) : chat.model ? (
                                <span className="truncate max-w-22.5 text-[10px] text-zinc-500" title={chat.model}>
                                    {modelInfo?.shortName || chat.model}
                                </span>
                            ) : null}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getNetworkIconSrc(chat.network)}
                                alt={getNetworkShortLabel(chat.network)}
                                title={getNetworkShortLabel(chat.network)}
                                className="w-3 h-3 object-contain shrink-0 rounded-sm"
                            />
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">{formatRelativeTime(chat.updatedAt)}</span>
                        </div>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onOpenChatMenu(chat.id, e.currentTarget)
                    }}
                    className={`p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ${activeDropdownId === chat.id
                        ? 'opacity-100'
                        : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                        }`}
                >
                    <FiMoreVertical size={14} />
                </button>

                {isRunning ? (
                    <span className="shrink-0 relative flex h-2.5 w-2.5 items-center justify-center ml-0.5" title="Agent is working">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                ) : hasUnread ? (
                    <span className="shrink-0 relative flex h-2.5 w-2.5 items-center justify-center ml-0.5" title="Unread message">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-sm shadow-indigo-500/50" />
                    </span>
                ) : null}
            </div>
        </div>
    )
}
