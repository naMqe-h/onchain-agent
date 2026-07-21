'use client'

import { FiChevronRight, FiChevronDown, FiFolder, FiMoreVertical } from 'react-icons/fi'
import ChatRow from './ChatRow'

interface Folder {
    id: string
    name: string
    sortOrder: number
}

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

interface FolderRowProps {
    folder: Folder
    folderChats: Chat[]
    isFolderCollapsed: boolean
    isRenaming: boolean
    renameFolderName: string
    folderMenuId: string | null
    onPersistFolderCollapsed: (collapsed: boolean) => void
    onRenameFolderSubmit: (folderId: string) => Promise<void>
    onSetRenameFolderName: (val: string) => void
    onSetRenamingFolderId: (val: string | null) => void
    onOpenFolderMenu: (folderId: string, anchorEl: HTMLElement) => void

    pathname: string
    editingChatId: string | null
    editTitle: string
    activeDropdownId: string | null
    onSetEditTitle: (val: string) => void
    onSetEditingChatId: (val: string | null) => void
    onRenameChatSubmit: (chatId: string) => Promise<void>
    onOpenChatMenu: (chatId: string, anchorEl: HTMLElement) => void
    onCloseMobileMenu: () => void
}

export default function FolderRow({
    folder,
    folderChats,
    isFolderCollapsed,
    isRenaming,
    renameFolderName,
    folderMenuId,
    onPersistFolderCollapsed,
    onRenameFolderSubmit,
    onSetRenameFolderName,
    onSetRenamingFolderId,
    onOpenFolderMenu,

    pathname,
    editingChatId,
    editTitle,
    activeDropdownId,
    onSetEditTitle,
    onSetEditingChatId,
    onRenameChatSubmit,
    onOpenChatMenu,
    onCloseMobileMenu,
}: FolderRowProps) {
    return (
        <div className="relative">
            <div className="flex items-center gap-1 px-1 py-1 rounded-lg group/folder hover:bg-white/5">
                <button
                    type="button"
                    onClick={() => onPersistFolderCollapsed(!isFolderCollapsed)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer shrink-0"
                    aria-label={isFolderCollapsed ? 'Expand folder' : 'Collapse folder'}
                >
                    {isFolderCollapsed ? (
                        <FiChevronRight size={12} />
                    ) : (
                        <FiChevronDown size={12} />
                    )}
                </button>
                <FiFolder
                    size={12}
                    className={`shrink-0 ${isFolderCollapsed ? 'text-zinc-500' : 'text-zinc-400'}`}
                />
                {isRenaming ? (
                    <input
                        type="text"
                        value={renameFolderName}
                        onChange={(e) => onSetRenameFolderName(e.target.value)}
                        onBlur={() => onRenameFolderSubmit(folder.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameFolderSubmit(folder.id)
                            if (e.key === 'Escape') onSetRenamingFolderId(null)
                        }}
                        autoFocus
                        maxLength={40}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs text-zinc-100 py-0.5"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => onPersistFolderCollapsed(!isFolderCollapsed)}
                        className={`flex-1 min-w-0 text-left text-xs font-medium truncate cursor-pointer ${isFolderCollapsed ? 'text-zinc-400' : 'text-zinc-300'
                            }`}
                    >
                        {folder.name}
                        <span className="text-zinc-600 ml-1">
                            ({folderChats.length})
                        </span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onOpenFolderMenu(folder.id, e.currentTarget)
                    }}
                    className={`p-1 rounded-md hover:bg-white/10 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer ${folderMenuId === folder.id
                            ? 'opacity-100'
                            : 'opacity-100 md:opacity-0 md:group-hover/folder:opacity-100'
                        }`}
                >
                    <FiMoreVertical size={12} />
                </button>
            </div>

            {!isFolderCollapsed && (
                <div className="relative ml-3.5 mr-1 mt-0.5">
                    <div
                        className="absolute left-0 top-0 bottom-1 w-px bg-linear-to-b from-white/20 via-white/12 to-transparent"
                        aria-hidden
                    />
                    <div className="flex flex-col gap-0.5 pl-2.5">
                        {folderChats.length === 0 ? (
                            <p className="text-[11px] text-zinc-600 px-2 py-1.5">
                                Empty
                            </p>
                        ) : (
                            folderChats.map((chat) => (
                                <ChatRow
                                    key={chat.id}
                                    chat={chat}
                                    pathname={pathname}
                                    inFolder
                                    editingChatId={editingChatId}
                                    editTitle={editTitle}
                                    activeDropdownId={activeDropdownId}
                                    onSetEditTitle={onSetEditTitle}
                                    onSetEditingChatId={onSetEditingChatId}
                                    onRenameSubmit={onRenameChatSubmit}
                                    onOpenChatMenu={onOpenChatMenu}
                                    onCloseMobileMenu={onCloseMobileMenu}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
