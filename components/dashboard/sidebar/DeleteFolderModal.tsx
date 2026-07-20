'use client'

interface DeleteFolderModalProps {
    onClose: () => void
    onConfirm: () => void
}

export default function DeleteFolderModal({ onClose, onConfirm }: DeleteFolderModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                <h3 className="text-lg font-medium text-zinc-100">Delete Folder</h3>
                <p className="text-sm text-zinc-400">
                    Chats in this folder will move back to Recent. The chats themselves will not be deleted.
                </p>
                <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                    >
                        Delete folder
                    </button>
                </div>
            </div>
        </div>
    )
}
