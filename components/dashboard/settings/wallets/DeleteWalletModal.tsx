import { useState, FormEvent } from 'react'
import { FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi'
import { deleteWallet } from '../../../../app/actions/wallet'

interface DeleteWalletModalProps {
    isOpen: boolean
    onClose: () => void
    walletId: string
    walletName: string
    walletAddress: string
    onDeleted: () => void
}

export default function DeleteWalletModal({
    isOpen,
    onClose,
    walletId,
    walletName,
    walletAddress,
    onDeleted
}: DeleteWalletModalProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setIsDeleting(true)
        try {
            const res = await deleteWallet(walletId, password)
            if (res.error) {
                setError(res.error)
            } else if (res.success) {
                setPassword('')
                onDeleted()
                onClose()
            } else {
                setError('Failed to delete wallet')
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-[#18181b] border border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl flex flex-col gap-4 mx-4 text-zinc-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <FiTrash2 className="text-red-400" size={18} />
                        <h3 className="text-sm font-semibold text-zinc-200">Delete Wallet</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                        <FiAlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                        <div>
                            <strong>Important Warning:</strong> Deleting a wallet is permanent and cannot be undone. We strongly recommend that you <strong>export and save your private key securely</strong> before proceeding with deletion.
                        </div>
                    </div>

                    <div className="p-3 bg-[#141416] border border-white/5 rounded-xl flex flex-col gap-1">
                        <span className="text-xs font-semibold text-zinc-200">{walletName}</span>
                        <span className="text-[11px] font-mono text-zinc-500 truncate">{walletAddress}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Confirm Account Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your account password"
                            className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500/50 transition-colors w-full"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Wallet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
