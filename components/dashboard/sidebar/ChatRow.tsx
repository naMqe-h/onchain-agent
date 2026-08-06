'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiStar, FiMoreVertical, FiCheckCircle, FiLoader } from 'react-icons/fi'
import { formatShortRelativeTime } from '../../../lib/format'
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
    const startTime = useChatActivityStore((s) => s.runningStartTimes[chat.id])
    const isCompletedUnread = useChatActivityStore((s) => s.completedUnreadChats[chat.id])
    const clearChatUnread = useChatActivityStore((s) => s.clearChatUnread)

    const hasUnread = !isActive && (Boolean(chat.hasUnread) || Boolean(isCompletedUnread))

    useEffect(() => {
        if (isActive && isCompletedUnread) {
            clearChatUnread(chat.id)
        }
    }, [isActive, isCompletedUnread, chat.id, clearChatUnread])

    const catalog = useModelsStore((s) => s.models)
    const modelInfo = catalog.find((m) => m.id === chat.model)

    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (!isRunning || !startTime) return
        setNow(Date.now())
        const interval = setInterval(() => {
            setNow(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [isRunning, startTime])

    const elapsedSeconds = isRunning && startTime ? Math.max(0, Math.floor((now - startTime) / 1000)) : 0
    const isTitleBold = isActive || hasUnread

    return (
        <div className={`relative ${inFolder ? 'pl-0' : ''}`}>
            <Link
                href={`/chat/${chat.id}`}
                onClick={onCloseMobileMenu}
                className={`flex flex-col gap-1.5 rounded-xl transition-all group ${inFolder ? 'px-2.5 py-2' : 'px-3 py-2.5'
                    } ${isActive
                        ? 'bg-white/8 text-zinc-100'
                        : inFolder
                            ? 'text-zinc-400 hover:bg-white/4 hover:text-zinc-200'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
            >
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {showPinIcon && (
                            <FiStar size={13} className="shrink-0 text-amber-400/90" />
                        )}
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
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                            />
                        ) : (
                            <p className={`truncate text-sm leading-tight ${isTitleBold
                                ? 'font-bold text-zinc-100'
                                : 'font-normal text-zinc-300'
                                }`}>
                                {chat.title}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center shrink-0">
                        {isRunning ? (
                            <div className="flex items-center gap-1 text-sky-400 text-xs font-medium">
                                <FiLoader size={13} className="animate-spin text-sky-400" />
                                <span>Working {elapsedSeconds}s</span>
                            </div>
                        ) : hasUnread ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                                <FiCheckCircle size={13} className="text-emerald-400" />
                                <span>Done</span>
                            </div>
                        ) : (
                            <span className="text-zinc-500 text-xs font-normal">
                                {formatShortRelativeTime(chat.updatedAt)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs min-h-4.5 text-zinc-500 gap-2">
                    <div className="flex items-center justify-between flex-1 min-w-0 gap-2 pr-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <img
                                src={getNetworkIconSrc(chat.network)}
                                alt={getNetworkShortLabel(chat.network)}
                                title={getNetworkShortLabel(chat.network)}
                                className="w-3.5 h-3.5 object-contain shrink-0 rounded-sm"
                            />
                            <span className="truncate text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                {getNetworkShortLabel(chat.network)}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 min-w-0">
                            {modelInfo?.icon ? (
                                <img
                                    src={`/models/${modelInfo.icon}`}
                                    alt={modelInfo.shortName || chat.model || ''}
                                    title={modelInfo.name || chat.model || ''}
                                    className="w-3.5 h-3.5 object-contain shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                            ) : null}
                            {chat.model ? (
                                <span className="truncate text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors" title={modelInfo?.name || chat.model}>
                                    {modelInfo?.shortName || modelInfo?.name || chat.model}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onOpenChatMenu(chat.id, e.currentTarget)
                        }}
                        className={`p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0 ${activeDropdownId === chat.id
                            ? 'opacity-100'
                            : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                            }`}
                        title="Chat options"
                        aria-label="Chat options"
                    >
                        <FiMoreVertical size={13} />
                    </button>
                </div>
            </Link>
        </div>
    )
}


