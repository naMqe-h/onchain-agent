'use client'

import { FiEdit2, FiStar, FiFolder, FiCheck, FiArchive, FiTrash2 } from 'react-icons/fi'
import FloatingMenu, { type AnchorRect } from './FloatingMenu'

interface Chat {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
    isPinned: boolean
    pinnedAt: Date | null
    folderId: string | null
    network: string
    _count: { messages: number }
}

interface Folder {
    id: string
    name: string
    sortOrder: number
}

interface ChatActionMenuProps {
    activeChatForMenu: Chat
    menuAnchor: AnchorRect
    chatMenuWidth: number
    moveMenuChatId: string | null
    folders: Folder[]
    onClose: () => void
    onSetEditTitle: (title: string) => void
    onSetEditingChatId: (id: string | null) => void
    onTogglePin: (id: string) => Promise<void>
    onSetMoveMenuChatId: (id: string | null) => void
    onMoveToFolder: (chatId: string, folderId: string | null) => Promise<void>
    onArchive: (chatId: string) => Promise<void>
    onSetDeleteConfirmationId: (id: string | null) => void
}

export default function ChatActionMenu({
    activeChatForMenu,
    menuAnchor,
    chatMenuWidth,
    moveMenuChatId,
    folders,
    onClose,
    onSetEditTitle,
    onSetEditingChatId,
    onTogglePin,
    onSetMoveMenuChatId,
    onMoveToFolder,
    onArchive,
    onSetDeleteConfirmationId,
}: ChatActionMenuProps) {
    return (
        <FloatingMenu
            anchor={menuAnchor}
            width={chatMenuWidth}
            onClose={onClose}
            menuKey={`${activeChatForMenu.id}-${moveMenuChatId === activeChatForMenu.id ? 'move' : 'base'}`}
        >
            <button
                type="button"
                onClick={() => {
                    onSetEditTitle(activeChatForMenu.title)
                    onSetEditingChatId(activeChatForMenu.id)
                    onClose()
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
                <FiEdit2 size={12} />
                Rename
            </button>
            <button
                type="button"
                onClick={() => onTogglePin(activeChatForMenu.id)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
                <FiStar
                    size={12}
                    className={activeChatForMenu.isPinned ? 'text-amber-400' : ''}
                />
                {activeChatForMenu.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onSetMoveMenuChatId(
                            moveMenuChatId === activeChatForMenu.id
                                ? null
                                : activeChatForMenu.id
                        )
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                >
                    <FiFolder size={12} />
                    Move to folder
                </button>
                {moveMenuChatId === activeChatForMenu.id && (
                    <div className="mx-1 mb-1 mt-0.5 rounded-lg border border-white/8 bg-[#18181a] overflow-hidden py-1 max-h-40 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => onMoveToFolder(activeChatForMenu.id, null)}
                            className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
                        >
                            {activeChatForMenu.folderId === null ? (
                                <FiCheck size={11} className="text-emerald-400" />
                            ) : (
                                <span className="w-2.75" />
                            )}
                            No folder
                        </button>
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                type="button"
                                onClick={() =>
                                    onMoveToFolder(activeChatForMenu.id, folder.id)
                                }
                                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
                            >
                                {activeChatForMenu.folderId === folder.id ? (
                                    <FiCheck size={11} className="text-emerald-400" />
                                ) : (
                                    <span className="w-2.75" />
                                )}
                                <span className="truncate">{folder.name}</span>
                            </button>
                        ))}
                        {folders.length === 0 && (
                            <p className="px-3 py-1.5 text-[11px] text-zinc-500">
                                Create a folder first
                            </p>
                        )}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={() => onArchive(activeChatForMenu.id)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
                <FiArchive size={12} />
                Archive
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
                type="button"
                onClick={() => {
                    onSetDeleteConfirmationId(activeChatForMenu.id)
                    onClose()
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 cursor-pointer transition-colors"
            >
                <FiTrash2 size={12} />
                Delete
            </button>
        </FloatingMenu>
    )
}
