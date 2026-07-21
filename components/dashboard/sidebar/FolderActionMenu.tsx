'use client'

import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import FloatingMenu from './FloatingMenu'
import { type Folder, type AnchorRect } from '@/types'

interface FolderActionMenuProps {
    activeFolderForMenu: Folder
    menuAnchor: AnchorRect
    folderMenuWidth: number
    onClose: () => void
    onSetRenameFolderName: (name: string) => void
    onSetRenamingFolderId: (id: string | null) => void
    onSetDeleteFolderId: (id: string | null) => void
}

export default function FolderActionMenu({
    activeFolderForMenu,
    menuAnchor,
    folderMenuWidth,
    onClose,
    onSetRenameFolderName,
    onSetRenamingFolderId,
    onSetDeleteFolderId,
}: FolderActionMenuProps) {
    return (
        <FloatingMenu
            anchor={menuAnchor}
            width={folderMenuWidth}
            onClose={onClose}
            menuKey={activeFolderForMenu.id}
        >
            <button
                type="button"
                onClick={() => {
                    onSetRenameFolderName(activeFolderForMenu.name)
                    onSetRenamingFolderId(activeFolderForMenu.id)
                    onClose()
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-2 cursor-pointer"
            >
                <FiEdit2 size={12} />
                Rename
            </button>
            <button
                type="button"
                onClick={() => {
                    onSetDeleteFolderId(activeFolderForMenu.id)
                    onClose()
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 cursor-pointer"
            >
                <FiTrash2 size={12} />
                Delete
            </button>
        </FloatingMenu>
    )
}
