import { useState } from 'react'
import { FiX, FiLock, FiEye, FiEyeOff, FiCopy, FiCheck } from 'react-icons/fi'

interface PrivateKeyDisplayModalProps {
    isOpen: boolean
    onClose: () => void
    walletName: string
    privateKey: string
}

export default function PrivateKeyDisplayModal({
    isOpen,
    onClose,
    walletName,
    privateKey
}: PrivateKeyDisplayModalProps) {
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    if (!isOpen) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(privateKey)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
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
                        <FiLock className="text-amber-400" size={18} />
                        <h3 className="text-sm font-semibold text-zinc-200">Wallet Private Key</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                        <FiX size={16} />
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2.5">
                        <FiLock size={16} className="shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                            <strong>WARNING: Never share your private key.</strong> Anyone who obtains this key will have complete control over all funds in this wallet.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-500">Private Key ({walletName})</label>
                        <div className="relative bg-[#141416] border border-white/10 rounded-xl p-3 font-mono text-xs break-all select-all">
                            <span className={isRevealed ? 'text-zinc-200' : 'text-zinc-200 blur-md select-none'}>
                                {privateKey}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsRevealed(!isRevealed)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-white/5"
                        >
                            {isRevealed ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                            <span>{isRevealed ? 'Hide Key' : 'Reveal'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                {isCopied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
