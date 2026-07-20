'use client'

import { type ReactNode, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { FiPlus, FiChevronRight, FiChevronDown } from 'react-icons/fi'
import ChatRow from './ChatRow'
import FolderRow from './FolderRow'

type SidebarSectionId = 'pinned' | 'folders' | 'recent'

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

interface Folder {
    id: string
    name: string
    sortOrder: number
}

interface SidebarNavigationListProps {
    user: User | null
    chats: Chat[]
    folders: Folder[]
    pathname: string
    actionError: string
    collapsedSections: Record<SidebarSectionId, boolean>
    collapsedFolders: Record<string, boolean>
    isCreatingFolder: boolean
    newFolderName: string
    folderMenuId: string | null
    renamingFolderId: string | null
    renameFolderName: string
    editingChatId: string | null
    editTitle: string
    activeDropdownId: string | null

    onToggleSection: (id: SidebarSectionId) => void
    onPersistFolderCollapsed: (folderId: string, collapsed: boolean) => void
    onSetIsCreatingFolder: (val: boolean) => void
    onSetNewFolderName: (val: string) => void
    onSetActionError: (val: string) => void
    onCloseMenus: () => void
    onSetRenameFolderName: (val: string) => void
    onSetRenamingFolderId: (val: string | null) => void
    onSetEditTitle: (val: string) => void
    onSetEditingChatId: (val: string | null) => void
    onRenameChatSubmit: (chatId: string) => Promise<void>
    onOpenChatMenu: (chatId: string, anchorEl: HTMLElement) => void
    onOpenFolderMenu: (folderId: string, anchorEl: HTMLElement) => void
    onCloseMobileMenu: () => void
    onRenameFolderSubmit: (folderId: string) => Promise<void>
    onCreateFolder: () => Promise<void>
}

function toTime(value: Date | string | null | undefined): number {
    if (!value) return 0
    return new Date(value).getTime()
}

export default function SidebarNavigationList({
    user,
    chats,
    folders,
    pathname,
    actionError,
    collapsedSections,
    collapsedFolders,
    isCreatingFolder,
    newFolderName,
    folderMenuId,
    renamingFolderId,
    renameFolderName,
    editingChatId,
    editTitle,
    activeDropdownId,

    onToggleSection,
    onPersistFolderCollapsed,
    onSetIsCreatingFolder,
    onSetNewFolderName,
    onSetActionError,
    onCloseMenus,
    onSetRenameFolderName,
    onSetRenamingFolderId,
    onSetEditTitle,
    onSetEditingChatId,
    onRenameChatSubmit,
    onOpenChatMenu,
    onOpenFolderMenu,
    onCloseMobileMenu,
    onRenameFolderSubmit,
    onCreateFolder,
}: SidebarNavigationListProps) {
    const visibleChats = useMemo(() => {
        return chats.filter(
            (chat) => chat._count.messages > 0 || pathname === `/chat/${chat.id}`
        )
    }, [chats, pathname])

    const pinnedChats = useMemo(() => {
        return visibleChats
            .filter((c) => c.isPinned)
            .sort((a, b) => {
                const pinDiff = toTime(b.pinnedAt) - toTime(a.pinnedAt)
                if (pinDiff !== 0) return pinDiff
                return toTime(b.updatedAt) - toTime(a.updatedAt)
            })
    }, [visibleChats])

    const recentChats = useMemo(() => {
        return visibleChats.filter((c) => !c.isPinned && !c.folderId)
    }, [visibleChats])

    const chatsInFolder = (folderId: string) =>
        visibleChats.filter((c) => !c.isPinned && c.folderId === folderId)

    const renderSectionHeader = (
        id: SidebarSectionId,
        label: string,
        count?: number,
        trailing?: ReactNode
    ) => {
        const isCollapsed = collapsedSections[id]
        return (
            <div className="flex items-center gap-0.5 px-0.5 mb-1">
                <button
                    type="button"
                    onClick={() => onToggleSection(id)}
                    className="flex-1 min-w-0 flex items-center gap-1 px-1.5 py-1 rounded-lg text-left text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
                    aria-expanded={!isCollapsed}
                    title={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
                >
                    {isCollapsed ? (
                        <FiChevronRight size={12} className="shrink-0" />
                    ) : (
                        <FiChevronDown size={12} className="shrink-0" />
                    )}
                    <span className="text-[11px] font-semibold uppercase tracking-wider truncate">
                        {label}
                    </span>
                    {typeof count === 'number' && (
                        <span className="text-[10px] font-medium text-zinc-600 tabular-nums">
                            {count}
                        </span>
                    )}
                </button>
                {trailing}
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="flex-1 px-4 pb-6 overflow-y-auto flex flex-col min-h-0 gap-4">
            {actionError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                    {actionError}
                </p>
            )}

            {pinnedChats.length > 0 && (
                <div className="flex flex-col gap-0.5">
                    {renderSectionHeader('pinned', 'Pinned', pinnedChats.length)}
                    {!collapsedSections.pinned &&
                        pinnedChats.map((chat) => (
                            <ChatRow
                                key={chat.id}
                                chat={chat}
                                pathname={pathname}
                                showPinIcon={true}
                                editingChatId={editingChatId}
                                editTitle={editTitle}
                                activeDropdownId={activeDropdownId}
                                onSetEditTitle={onSetEditTitle}
                                onSetEditingChatId={onSetEditingChatId}
                                onRenameSubmit={onRenameChatSubmit}
                                onOpenChatMenu={onOpenChatMenu}
                                onCloseMobileMenu={onCloseMobileMenu}
                            />
                        ))}
                </div>
            )}

            <div className="flex flex-col gap-0.5">
                {renderSectionHeader(
                    'folders',
                    'Folders',
                    folders.length,
                    <button
                        type="button"
                        onClick={() => {
                            onSetIsCreatingFolder(true)
                            onSetNewFolderName('')
                            onSetActionError('')
                            onCloseMenus()
                            if (collapsedSections.folders) {
                                onToggleSection('folders')
                            }
                        }}
                        className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                        title="New folder"
                        aria-label="New folder"
                    >
                        <FiPlus size={12} />
                    </button>
                )}

                {!collapsedSections.folders && (
                    <>
                        {isCreatingFolder && (
                            <div className="px-2 mb-1">
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => onSetNewFolderName(e.target.value)}
                                    onBlur={() => onCreateFolder()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onCreateFolder()
                                        if (e.key === 'Escape') {
                                            onSetIsCreatingFolder(false)
                                            onSetNewFolderName('')
                                        }
                                    }}
                                    autoFocus
                                    placeholder="Folder name"
                                    maxLength={40}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-white/20"
                                />
                            </div>
                        )}

                        {folders.map((folder) => {
                            const folderChats = chatsInFolder(folder.id)
                            const isFolderCollapsed = collapsedFolders[folder.id] === true
                            const isRenaming = renamingFolderId === folder.id

                            return (
                                <FolderRow
                                    key={folder.id}
                                    folder={folder}
                                    folderChats={folderChats}
                                    isFolderCollapsed={isFolderCollapsed}
                                    isRenaming={isRenaming}
                                    renameFolderName={renameFolderName}
                                    folderMenuId={folderMenuId}
                                    onPersistFolderCollapsed={(collapsed) =>
                                        onPersistFolderCollapsed(folder.id, collapsed)
                                    }
                                    onRenameFolderSubmit={onRenameFolderSubmit}
                                    onSetRenameFolderName={onSetRenameFolderName}
                                    onSetRenamingFolderId={onSetRenamingFolderId}
                                    onOpenFolderMenu={onOpenFolderMenu}
                                    pathname={pathname}
                                    editingChatId={editingChatId}
                                    editTitle={editTitle}
                                    activeDropdownId={activeDropdownId}
                                    onSetEditTitle={onSetEditTitle}
                                    onSetEditingChatId={onSetEditingChatId}
                                    onRenameChatSubmit={onRenameChatSubmit}
                                    onOpenChatMenu={onOpenChatMenu}
                                    onCloseMobileMenu={onCloseMobileMenu}
                                />
                            )
                        })}

                        {folders.length === 0 && !isCreatingFolder && (
                            <p className="text-[11px] text-zinc-600 px-2 py-1">
                                No folders yet
                            </p>
                        )}
                    </>
                )}
            </div>

            {recentChats.length > 0 && (
                <div className="flex flex-col gap-0.5">
                    {renderSectionHeader('recent', 'Recent', recentChats.length)}
                    {!collapsedSections.recent &&
                        recentChats.map((chat) => (
                            <ChatRow
                                key={chat.id}
                                chat={chat}
                                pathname={pathname}
                                editingChatId={editingChatId}
                                editTitle={editTitle}
                                activeDropdownId={activeDropdownId}
                                onSetEditTitle={onSetEditTitle}
                                onSetEditingChatId={onSetEditingChatId}
                                onRenameSubmit={onRenameChatSubmit}
                                onOpenChatMenu={onOpenChatMenu}
                                onCloseMobileMenu={onCloseMobileMenu}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}
