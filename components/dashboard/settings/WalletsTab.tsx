import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { FiPlus, FiCreditCard, FiCopy, FiCheck } from 'react-icons/fi'
import { getUserWallets, createWallet } from '../../../app/actions/wallet'

interface WalletsTabProps {
    user: User
}

export default function WalletsTab({ user }: WalletsTabProps) {
    const [wallets, setWallets] = useState<{ id: string; name: string; address: string; type: string }[]>([])
    const [isLoadingWallets, setIsLoadingWallets] = useState(false)
    const [walletError, setWalletError] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newWalletName, setNewWalletName] = useState('')
    const [newWalletType, setNewWalletType] = useState<'burner' | 'imported'>('burner')
    const [importedPrivateKey, setImportedPrivateKey] = useState('')
    const [isSubmittingWallet, setIsSubmittingWallet] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const fetchWallets = async () => {
        setIsLoadingWallets(true)
        setWalletError('')
        try {
            const data = await getUserWallets(user.id)
            setWallets(data)
        } catch (err: any) {
            setWalletError(err.message || 'Failed to fetch wallets')
        } finally {
            setIsLoadingWallets(false)
        }
    }

    useEffect(() => {
        fetchWallets()
        setShowCreateForm(false)
        setWalletError('')
    }, [user.id])

    const handleCopy = (id: string, address: string) => {
        navigator.clipboard.writeText(address)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCreateWallet = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newWalletName.trim()) return

        setIsSubmittingWallet(true)
        setWalletError('')
        try {
            await createWallet(user.id, newWalletName.trim(), newWalletType, importedPrivateKey.trim() || undefined)
            setNewWalletName('')
            setImportedPrivateKey('')
            setShowCreateForm(false)
            await fetchWallets()
        } catch (err: any) {
            setWalletError(err.message || 'Failed to create wallet')
        } finally {
            setIsSubmittingWallet(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Wallets</h2>
                {!showCreateForm && (
                    <button
                        onClick={() => {
                            setShowCreateForm(true)
                            setNewWalletName('')
                            setNewWalletType('burner')
                            setImportedPrivateKey('')
                            setWalletError('')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-white/5"
                    >
                        <FiPlus size={14} />
                        <span>Add Wallet</span>
                    </button>
                )}
            </div>

            {walletError && (
                <div className="mt-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl shrink-0">
                    {walletError}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pt-4 pr-1">
                {showCreateForm ? (
                    <form onSubmit={handleCreateWallet} className="flex flex-col gap-4 max-w-md bg-[#1c1c1f]/40 p-4 border border-white/5 rounded-2xl">
                        <h3 className="text-sm font-semibold text-zinc-300">Create New Wallet</h3>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-zinc-500">Wallet Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. My Primary Wallet"
                                value={newWalletName}
                                onChange={(e) => setNewWalletName(e.target.value)}
                                className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-zinc-500">Wallet Type</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewWalletType('burner')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${newWalletType === 'burner'
                                            ? 'bg-white/5 text-zinc-100 border-white/20 shadow-inner'
                                            : 'bg-transparent text-zinc-500 border-white/5 hover:text-zinc-300'
                                        }`}
                                >
                                    Generate Burner
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewWalletType('imported')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${newWalletType === 'imported'
                                            ? 'bg-white/5 text-zinc-100 border-white/20 shadow-inner'
                                            : 'bg-transparent text-zinc-500 border-white/5 hover:text-zinc-300'
                                        }`}
                                >
                                    Import Private Key
                                </button>
                            </div>
                        </div>

                        {newWalletType === 'imported' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-zinc-500">Private Key (Hex)</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="0x..."
                                    value={importedPrivateKey}
                                    onChange={(e) => setImportedPrivateKey(e.target.value)}
                                    className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingWallet}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                            >
                                {isSubmittingWallet ? 'Saving...' : 'Save Wallet'}
                            </button>
                        </div>
                    </form>
                ) : isLoadingWallets ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Loading wallets...
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center">
                        <FiCreditCard size={40} className="mb-3 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-400">No Wallets Connected</p>
                        <p className="text-xs text-zinc-600 mt-1 mb-4">Create a burner wallet or import your private key to get started.</p>
                        <button
                            onClick={() => {
                                setShowCreateForm(true)
                                setNewWalletName('')
                                setNewWalletType('burner')
                                setImportedPrivateKey('')
                                setWalletError('')
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                        >
                            <FiPlus size={14} />
                            <span>Create First Wallet</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {wallets.map((wallet) => (
                            <div key={wallet.id} className="flex items-center justify-between p-3.5 bg-[#1c1c1f]/30 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-zinc-200 truncate">{wallet.name}</span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${wallet.type === 'burner'
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                                            }`}>
                                            {wallet.type === 'burner' ? 'Burner' : 'Imported'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-zinc-500 font-mono truncate">{wallet.address}</span>
                                </div>

                                <button
                                    onClick={() => handleCopy(wallet.id, wallet.address)}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                                    title="Copy address"
                                >
                                    {copiedId === wallet.id ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
