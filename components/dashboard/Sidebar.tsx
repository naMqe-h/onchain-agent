'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import {
    FiPlus,
    FiMenu,
    FiX,
    FiLogIn,
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
import { type PublicProfile, type AnchorRect, type Chat, type Folder, type SidebarSectionId } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { slideInLeft } from '../../lib/motion'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import DeleteChatModal from './sidebar/DeleteChatModal'
import DeleteFolderModal from './sidebar/DeleteFolderModal'
import ChatActionMenu from './sidebar/ChatActionMenu'
import FolderActionMenu from './sidebar/FolderActionMenu'
import SidebarHeaderControls from './sidebar/SidebarHeaderControls'
import SidebarNavigationList from './sidebar/SidebarNavigationList'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'
const FOLDER_COLLAPSED_KEY = 'sidebar-folder-collapsed'
const SECTION_COLLAPSED_KEY = 'sidebar-section-collapsed'
const CHAT_MENU_WIDTH = 192
const FOLDER_MENU_WIDTH = 144

const DEFAULT_SECTION_COLLAPSED: Record<SidebarSectionId, boolean> = {
    pinned: false,
    folders: false,
    recent: false,
}

interface SidebarProps {
    user: User | null
    chats: Chat[]
    folders: Folder[]
    profile: PublicProfile | null
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

    const rectFromEl = (el: HTMLElement): AnchorRect => {
        const r = el.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    }

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

    const persistFolderCollapsed = (folderId: string, nextCollapsed: boolean) => {
        const next = { ...collapsedFolders, [folderId]: nextCollapsed }
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

    const activeChatForMenu = activeDropdownId
        ? chats.find((c) => c.id === activeDropdownId) ?? null
        : null
    const activeFolderForMenu = folderMenuId
        ? folders.find((f) => f.id === folderMenuId) ?? null
        : null

    const unreadCount = useMemo(() => {
        return chats.filter((c) => c.hasUnread && pathname !== `/chat/${c.id}`).length
    }, [chats, pathname])

    const renderSidebarContent = (collapsed: boolean) => {
        if (collapsed) {
            return (
                <>
                    <SidebarHeaderControls
                        collapsed={true}
                        user={user}
                        unreadCount={unreadCount}
                        onToggleCollapse={toggleCollapse}
                        onNewChat={handleNewChat}
                        onOpenSearch={() => setIsSearchOpen(true)}
                    />

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
                <SidebarHeaderControls
                    collapsed={false}
                    user={user}
                    unreadCount={unreadCount}
                    onToggleCollapse={toggleCollapse}
                    onNewChat={handleNewChat}
                    onOpenSearch={() => setIsSearchOpen(true)}
                />

                <SidebarNavigationList
                    user={user}
                    chats={chats}
                    folders={folders}
                    pathname={pathname}
                    actionError={actionError}
                    collapsedSections={collapsedSections}
                    collapsedFolders={collapsedFolders}
                    isCreatingFolder={isCreatingFolder}
                    newFolderName={newFolderName}
                    folderMenuId={folderMenuId}
                    renamingFolderId={renamingFolderId}
                    renameFolderName={renameFolderName}
                    editingChatId={editingChatId}
                    editTitle={editTitle}
                    activeDropdownId={activeDropdownId}
                    onToggleSection={toggleSection}
                    onPersistFolderCollapsed={persistFolderCollapsed}
                    onSetIsCreatingFolder={setIsCreatingFolder}
                    onSetNewFolderName={setNewFolderName}
                    onSetActionError={setActionError}
                    onCloseMenus={closeMenus}
                    onSetRenameFolderName={setRenameFolderName}
                    onSetRenamingFolderId={setRenamingFolderId}
                    onSetEditTitle={setEditTitle}
                    onSetEditingChatId={setEditingChatId}
                    onRenameChatSubmit={handleRenameSubmit}
                    onOpenChatMenu={openChatMenu}
                    onOpenFolderMenu={openFolderMenu}
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                    onRenameFolderSubmit={handleRenameFolderSubmit}
                    onCreateFolder={handleCreateFolder}
                />

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
                <DeleteChatModal
                    onClose={() => setDeleteConfirmationId(null)}
                    onConfirm={() => handleDelete(deleteConfirmationId)}
                />
            )}

            {deleteFolderId && (
                <DeleteFolderModal
                    onClose={() => setDeleteFolderId(null)}
                    onConfirm={() => handleDeleteFolder(deleteFolderId)}
                />
            )}

            <ChatSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectChat={() => setIsMobileMenuOpen(false)}
            />

            {activeChatForMenu && menuAnchor && (
                <ChatActionMenu
                    activeChatForMenu={activeChatForMenu}
                    menuAnchor={menuAnchor}
                    chatMenuWidth={CHAT_MENU_WIDTH}
                    moveMenuChatId={moveMenuChatId}
                    folders={folders}
                    onClose={closeMenus}
                    onSetEditTitle={setEditTitle}
                    onSetEditingChatId={setEditingChatId}
                    onTogglePin={handleTogglePin}
                    onSetMoveMenuChatId={setMoveMenuChatId}
                    onMoveToFolder={handleMoveToFolder}
                    onArchive={handleArchive}
                    onSetDeleteConfirmationId={setDeleteConfirmationId}
                />
            )}

            {activeFolderForMenu && menuAnchor && (
                <FolderActionMenu
                    activeFolderForMenu={activeFolderForMenu}
                    menuAnchor={menuAnchor}
                    folderMenuWidth={FOLDER_MENU_WIDTH}
                    onClose={closeMenus}
                    onSetRenameFolderName={setRenameFolderName}
                    onSetRenamingFolderId={setRenamingFolderId}
                    onSetDeleteFolderId={setDeleteFolderId}
                />
            )}
        </>
    )
}
