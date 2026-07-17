import { useState, FormEvent } from 'react'
import { FiX, FiLock } from 'react-icons/fi'

interface PasswordVerifyModalProps {
    isOpen: boolean
    onClose: () => void
    walletName: string
    walletAddress: string
    onVerified: (privateKey: string) => void
    verifyAction: (address: string, password: string) => Promise<{ privateKey?: string; error?: string }>
}

export default function PasswordVerifyModal({
    isOpen,
    onClose,
    walletName,
    walletAddress,
    onVerified,
    verifyAction
}: PasswordVerifyModalProps) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setIsVerifying(true)
        try {
            const res = await verifyAction(walletAddress, password)
            if (res.error) {
                setError(res.error)
            } else if (res.privateKey) {
                onVerified(res.privateKey)
            } else {
                setError('Failed to retrieve private key')
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setIsVerifying(false)
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
                        <FiLock className="text-indigo-400" size={18} />
                        <h3 className="text-sm font-semibold text-zinc-200">Verify Password</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Please enter your account password to verify your identity and view the private key for <strong>{walletName}</strong>.
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors w-full"
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
                            disabled={isVerifying}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                        >
                            {isVerifying ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
