'use client'

import { useState, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import {
    FiPlus,
    FiMessageSquare,
    FiMoreVertical,
    FiEdit2,
    FiArchive,
    FiTrash2,
    FiMenu,
    FiX,
    FiLogIn,
    FiChevronsLeft,
    FiChevronsRight,
    FiSearch,
    FiStar,
    FiFolder,
    FiChevronDown,
    FiChevronRight,
    FiCheck,
} from 'react-icons/fi'
import SidebarProfile from './SidebarProfile'
import ChatSearchModal from './ChatSearchModal'
import {
    updateChatTitle,
    archiveChat,
    deleteChat,
    togglePinChat,
    createFolder,
    renameFolder,
    deleteFolder,
    moveChatToFolder,
} from '../../app/actions/chat/chat'
import { PublicProfile } from '../../app/actions/profile/profile'
import { motion, AnimatePresence } from 'framer-motion'
import { slideInLeft } from '../../lib/motion'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { formatRelativeTime } from '../../lib/format'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'
const FOLDER_COLLAPSED_KEY = 'sidebar-folder-collapsed'
const SECTION_COLLAPSED_KEY = 'sidebar-section-collapsed'
const CHAT_MENU_WIDTH = 192
const FOLDER_MENU_WIDTH = 144

type SidebarSectionId = 'pinned' | 'folders' | 'recent'

const DEFAULT_SECTION_COLLAPSED: Record<SidebarSectionId, boolean> = {
    pinned: false,
    folders: false,
    recent: false,
}

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

interface SidebarProps {
    user: User | null
    chats: Chat[]
    folders: Folder[]
    profile: PublicProfile | null
}

interface AnchorRect {
    top: number
    bottom: number
    left: number
    right: number
}

function toTime(value: Date | string | null | undefined): number {
    if (!value) return 0
    return new Date(value).getTime()
}

function rectFromEl(el: HTMLElement): AnchorRect {
    const r = el.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
}

function FloatingMenu({
    anchor,
    width,
    onClose,
    children,
    menuKey,
}: {
    anchor: AnchorRect
    width: number
    onClose: () => void
    children: ReactNode
    menuKey?: string | number
}) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

    useLayoutEffect(() => {
        const el = menuRef.current
        if (!el) return

        const gap = 4
        const pad = 8
        const vh = window.innerHeight
        const vw = window.innerWidth
        const menuH = el.offsetHeight
        const menuW = el.offsetWidth || width

        let left = anchor.right - menuW
        left = Math.max(pad, Math.min(left, vw - menuW - pad))

        const spaceBelow = vh - anchor.bottom - gap - pad
        const spaceAbove = anchor.top - gap - pad
        const preferBelow = menuH <= spaceBelow || spaceBelow >= spaceAbove

        let top: number
        if (preferBelow) {
            top = anchor.bottom + gap
            if (top + menuH > vh - pad) {
                top = Math.max(pad, vh - menuH - pad)
            }
        } else {
            top = anchor.top - gap - menuH
            if (top < pad) top = pad
        }

        setCoords((prev) => {
            if (prev && prev.top === top && prev.left === left) return prev
            return { top, left }
        })
    }, [anchor.top, anchor.bottom, anchor.left, anchor.right, width, menuKey])

    if (typeof document === 'undefined') return null

    return createPortal(
        <>
            <div className="fixed inset-0 z-100" onClick={onClose} aria-hidden />
            <div
                ref={menuRef}
                data-floating-menu
                role="menu"
                className="fixed z-110 max-h-[min(360px,calc(100vh-16px))] overflow-y-auto overscroll-contain bg-[#1f1f22] border border-white/10 rounded-xl shadow-xl py-1"
                style={{
                    width,
                    top: coords?.top ?? 0,
                    left: coords?.left ?? 0,
                    opacity: coords ? 1 : 0,
                    pointerEvents: coords ? 'auto' : 'none',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    )
}

export default function Sidebar({ user, chats, folders, profile }: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
    const [moveMenuChatId, setMoveMenuChatId] = useState<string | null>(null)
    const [editingChatId, setEditingChatId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null)
    const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({})
    const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>(
        DEFAULT_SECTION_COLLAPSED
    )
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
    const [renameFolderName, setRenameFolderName] = useState('')
    const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
    const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
    const [actionError, setActionError] = useState('')
    const folderSubmitLock = useRef(false)
    const openAuthModal = useAuthModalStore(s => s.open)

    const openChatMenu = (chatId: string, anchorEl: HTMLElement) => {
        if (activeDropdownId === chatId) {
            setActiveDropdownId(null)
            setMoveMenuChatId(null)
            setMenuAnchor(null)
            return
        }
        setMenuAnchor(rectFromEl(anchorEl))
        setActiveDropdownId(chatId)
        setMoveMenuChatId(null)
        setFolderMenuId(null)
    }

    const openFolderMenu = (folderId: string, anchorEl: HTMLElement) => {
        if (folderMenuId === folderId) {
            setFolderMenuId(null)
            setMenuAnchor(null)
            return
        }
        setMenuAnchor(rectFromEl(anchorEl))
        setFolderMenuId(folderId)
        setActiveDropdownId(null)
        setMoveMenuChatId(null)
    }

    useEffect(() => {
        try {
            if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
                setIsCollapsed(true)
            }
            const raw = localStorage.getItem(FOLDER_COLLAPSED_KEY)
            if (raw) {
                const parsed = JSON.parse(raw) as Record<string, boolean>
                if (parsed && typeof parsed === 'object') {
                    setCollapsedFolders(parsed)
                }
            }
            const sectionRaw = localStorage.getItem(SECTION_COLLAPSED_KEY)
            if (sectionRaw) {
                const parsed = JSON.parse(sectionRaw) as Partial<Record<SidebarSectionId, boolean>>
                if (parsed && typeof parsed === 'object') {
                    setCollapsedSections({ ...DEFAULT_SECTION_COLLAPSED, ...parsed })
                }
            }
        } catch { /* ignore */ }
    }, [])

    const persistFolderCollapsed = (next: Record<string, boolean>) => {
        setCollapsedFolders(next)
        try {
            localStorage.setItem(FOLDER_COLLAPSED_KEY, JSON.stringify(next))
        } catch { /* ignore */ }
    }

    const toggleSection = (id: SidebarSectionId) => {
        setCollapsedSections((prev) => {
            const next = { ...prev, [id]: !prev[id] }
            try {
                localStorage.setItem(SECTION_COLLAPSED_KEY, JSON.stringify(next))
            } catch { /* ignore */ }
            return next
        })
    }

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
                    onClick={() => toggleSection(id)}
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

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev
            try {
                localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
            } catch { /* ignore */ }
            if (next) {
                setActiveDropdownId(null)
                setMoveMenuChatId(null)
                setEditingChatId(null)
                setFolderMenuId(null)
                setMenuAnchor(null)
                setIsCreatingFolder(false)
                setRenamingFolderId(null)
            }
            return next
        })
    }

    const closeMenus = () => {
        setActiveDropdownId(null)
        setMoveMenuChatId(null)
        setFolderMenuId(null)
        setMenuAnchor(null)
    }

    useEffect(() => {
        if (!activeDropdownId && !folderMenuId) return
        const onResize = () => closeMenus()
        const onScroll = (e: Event) => {
            const target = e.target
            if (target instanceof Element && target.closest('[data-floating-menu]')) return
            closeMenus()
        }
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onScroll, true)
        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('scroll', onScroll, true)
        }
    }, [activeDropdownId, folderMenuId])

    const handleNewChat = () => {
        setIsMobileMenuOpen(false)
        router.push('/')
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
        closeMenus()
        setIsMobileMenuOpen(false)
        router.refresh()
        if (pathname === `/chat/${chatId}`) {
            router.push('/')
        }
    }

    const handleDelete = async (chatId: string) => {
        await deleteChat(chatId)
        closeMenus()
        setDeleteConfirmationId(null)
        setIsMobileMenuOpen(false)
        router.refresh()
        if (pathname === `/chat/${chatId}`) {
            router.push('/')
        }
    }

    const handleTogglePin = async (chatId: string) => {
        setActionError('')
        try {
            await togglePinChat(chatId)
            closeMenus()
            router.refresh()
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to pin chat')
        }
    }

    const handleMoveToFolder = async (chatId: string, folderId: string | null) => {
        setActionError('')
        try {
            await moveChatToFolder(chatId, folderId)
            closeMenus()
            router.refresh()
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to move chat')
        }
    }

    const handleCreateFolder = async () => {
        const name = newFolderName.trim()
        if (!name) {
            setIsCreatingFolder(false)
            setNewFolderName('')
            return
        }
        if (folderSubmitLock.current) return
        folderSubmitLock.current = true
        setActionError('')
        try {
            await createFolder(name)
            setIsCreatingFolder(false)
            setNewFolderName('')
            router.refresh()
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to create folder')
        } finally {
            folderSubmitLock.current = false
        }
    }

    const handleRenameFolderSubmit = async (folderId: string) => {
        const name = renameFolderName.trim()
        if (!name) {
            setRenamingFolderId(null)
            return
        }
        if (folderSubmitLock.current) return
        folderSubmitLock.current = true
        setActionError('')
        try {
            await renameFolder(folderId, name)
            setRenamingFolderId(null)
            router.refresh()
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to rename folder')
        } finally {
            folderSubmitLock.current = false
        }
    }

    const handleDeleteFolder = async (folderId: string) => {
        setActionError('')
        try {
            await deleteFolder(folderId)
            setDeleteFolderId(null)
            closeMenus()
            router.refresh()
        } catch (err: unknown) {
            setActionError(err instanceof Error ? err.message : 'Failed to delete folder')
        }
    }

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

    const renderChatRow = (chat: Chat, opts?: { showPinIcon?: boolean; inFolder?: boolean }) => {
        const isActive = pathname === `/chat/${chat.id}`
        const showPinIcon = opts?.showPinIcon ?? chat.isPinned
        const inFolder = opts?.inFolder === true

        return (
            <div key={chat.id} className={`relative ${inFolder ? 'pl-0' : ''}`}>
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
                        onClick={() => setIsMobileMenuOpen(false)}
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
                            openChatMenu(chat.id, e.currentTarget)
                        }}
                        className={`p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer ${activeDropdownId === chat.id
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

    const activeChatForMenu = activeDropdownId
        ? chats.find((c) => c.id === activeDropdownId) ?? null
        : null
    const activeFolderForMenu = folderMenuId
        ? folders.find((f) => f.id === folderMenuId) ?? null
        : null

    const renderSidebarContent = (collapsed: boolean) => {
        if (collapsed) {
            return (
                <>
                    <div className="pt-4 pb-3 flex flex-col items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={toggleCollapse}
                            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                            aria-label="Expand sidebar"
                            title="Expand sidebar"
                        >
                            <FiChevronsRight size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer group"
                            aria-label="New Chat"
                            title="New Chat"
                        >
                            <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                        </button>
                        {user && (
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                                aria-label="Search chats"
                                title="Search chats"
                            >
                                <FiSearch size={16} className="shrink-0" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-h-0" />

                    {user ? (
                        <SidebarProfile user={user} profile={profile} collapsed />
                    ) : (
                        <div className="pb-4 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false)
                                    openAuthModal()
                                }}
                                className="p-2.5 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer text-zinc-400 hover:text-zinc-100"
                                aria-label="Sign In"
                                title="Sign In"
                            >
                                <FiLogIn size={16} />
                            </button>
                        </div>
                    )}
                </>
            )
        }

        return (
            <>
                <div className="px-4 pt-6 pb-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Onchain Agent</span>
                        <button
                            type="button"
                            onClick={toggleCollapse}
                            className="p-1.5 -mr-1 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                            aria-label="Collapse sidebar"
                            title="Collapse sidebar"
                        >
                            <FiChevronsLeft size={16} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer group"
                    >
                        <FiPlus size={16} className="shrink-0 group-hover:rotate-90 transition-transform duration-200" />
                        <span>New Chat</span>
                    </button>
                    {user && (
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 border border-transparent text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-all cursor-pointer"
                        >
                            <FiSearch size={16} className="shrink-0" />
                            <span>Search chats</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 px-4 pb-6 overflow-y-auto flex flex-col min-h-0 gap-4">
                    {actionError && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                            {actionError}
                        </p>
                    )}

                    {user && (
                        <>
                            {pinnedChats.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                    {renderSectionHeader('pinned', 'Pinned', pinnedChats.length)}
                                    {!collapsedSections.pinned &&
                                        pinnedChats.map((chat) =>
                                            renderChatRow(chat, { showPinIcon: true })
                                        )}
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
                                            setIsCreatingFolder(true)
                                            setNewFolderName('')
                                            setActionError('')
                                            closeMenus()
                                            if (collapsedSections.folders) {
                                                toggleSection('folders')
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
                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                    onBlur={() => handleCreateFolder()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCreateFolder()
                                                        if (e.key === 'Escape') {
                                                            setIsCreatingFolder(false)
                                                            setNewFolderName('')
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
                                                <div key={folder.id} className="relative">
                                                    <div className="flex items-center gap-1 px-1 py-1 rounded-lg group/folder hover:bg-white/5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                persistFolderCollapsed({
                                                                    ...collapsedFolders,
                                                                    [folder.id]: !isFolderCollapsed,
                                                                })
                                                            }
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
                                                            className={`shrink-0 ${isFolderCollapsed ? 'text-zinc-500' : 'text-zinc-400'
                                                                }`}
                                                        />
                                                        {isRenaming ? (
                                                            <input
                                                                type="text"
                                                                value={renameFolderName}
                                                                onChange={(e) => setRenameFolderName(e.target.value)}
                                                                onBlur={() => handleRenameFolderSubmit(folder.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleRenameFolderSubmit(folder.id)
                                                                    if (e.key === 'Escape') setRenamingFolderId(null)
                                                                }}
                                                                autoFocus
                                                                maxLength={40}
                                                                className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs text-zinc-100 py-0.5"
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    persistFolderCollapsed({
                                                                        ...collapsedFolders,
                                                                        [folder.id]: !isFolderCollapsed,
                                                                    })
                                                                }
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
                                                                openFolderMenu(folder.id, e.currentTarget)
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
                                                                    folderChats.map((chat) =>
                                                                        renderChatRow(chat, { inFolder: true })
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
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
                                        recentChats.map((chat) => renderChatRow(chat))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {user ? (
                    <SidebarProfile user={user} profile={profile} />
                ) : (
                    <div className="px-3 pb-4">
                        <button
                            type="button"
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
    }

    return (
        <>
            <div className="flex md:hidden h-14 border-b border-white/5 bg-[#131314] items-center justify-between px-4 w-full shrink-0">
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                    <FiMenu size={20} />
                </button>
                <span className="font-medium text-[16px] text-zinc-100 tracking-tight">Onchain Agent</span>
                <button
                    type="button"
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
                className={`hidden md:flex h-screen border-r border-white/5 bg-[#131314] flex-col shrink-0 transition-[width] duration-200 ease-out ${isCollapsed ? 'w-14' : 'w-56 lg:w-64'
                    }`}
            >
                {renderSidebarContent(isCollapsed)}
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
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        {renderSidebarContent(false)}
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
                                type="button"
                                onClick={() => setDeleteConfirmationId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteConfirmationId)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteFolderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-zinc-100">Delete Folder</h3>
                        <p className="text-sm text-zinc-400">
                            Chats in this folder will move back to Recent. The chats themselves will not be deleted.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteFolderId(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteFolder(deleteFolderId)}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                            >
                                Delete folder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ChatSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectChat={() => setIsMobileMenuOpen(false)}
            />

            {activeChatForMenu && menuAnchor && (
                <FloatingMenu
                    anchor={menuAnchor}
                    width={CHAT_MENU_WIDTH}
                    onClose={closeMenus}
                    menuKey={`${activeChatForMenu.id}-${moveMenuChatId === activeChatForMenu.id ? 'move' : 'base'}`}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setEditTitle(activeChatForMenu.title)
                            setEditingChatId(activeChatForMenu.id)
                            closeMenus()
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <FiEdit2 size={12} />
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTogglePin(activeChatForMenu.id)}
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
                                setMoveMenuChatId(
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
                                    onClick={() => handleMoveToFolder(activeChatForMenu.id, null)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
                                >
                                    {activeChatForMenu.folderId === null ? (
                                        <FiCheck size={11} className="text-emerald-400" />
                                    ) : (
                                        <span className="w-[11px]" />
                                    )}
                                    No folder
                                </button>
                                {folders.map((folder) => (
                                    <button
                                        key={folder.id}
                                        type="button"
                                        onClick={() =>
                                            handleMoveToFolder(activeChatForMenu.id, folder.id)
                                        }
                                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
                                    >
                                        {activeChatForMenu.folderId === folder.id ? (
                                            <FiCheck size={11} className="text-emerald-400" />
                                        ) : (
                                            <span className="w-[11px]" />
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
                        onClick={() => handleArchive(activeChatForMenu.id)}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <FiArchive size={12} />
                        Archive
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteConfirmationId(activeChatForMenu.id)
                            closeMenus()
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                        <FiTrash2 size={12} />
                        Delete
                    </button>
                </FloatingMenu>
            )}

            {activeFolderForMenu && menuAnchor && (
                <FloatingMenu
                    anchor={menuAnchor}
                    width={FOLDER_MENU_WIDTH}
                    onClose={closeMenus}
                    menuKey={activeFolderForMenu.id}
                >
                    <button
                        type="button"
                        onClick={() => {
                            setRenameFolderName(activeFolderForMenu.name)
                            setRenamingFolderId(activeFolderForMenu.id)
                            closeMenus()
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
                    >
                        <FiEdit2 size={12} />
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteFolderId(activeFolderForMenu.id)
                            closeMenus()
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                    >
                        <FiTrash2 size={12} />
                        Delete
                    </button>
                </FloatingMenu>
            )}
        </>
    )
}
