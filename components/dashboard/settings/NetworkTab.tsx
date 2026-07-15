import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiGlobe, FiCheck } from 'react-icons/fi'
import { createClient } from '../../../lib/supabase/client'

interface NetworkTabProps {
    user: User | null
}

export default function NetworkTab({ user }: NetworkTabProps) {
    const router = useRouter()
    const initialNetwork = user?.user_metadata?.activeNetwork || 'testnet'
    const [network, setNetwork] = useState<'mainnet' | 'testnet'>(initialNetwork)
    const [isUpdating, setIsUpdating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const handleNetworkChange = async (newNetwork: 'mainnet' | 'testnet') => {
        if (isUpdating || newNetwork === network) return

        setIsUpdating(true)
        setSuccessMessage('')
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                data: { activeNetwork: newNetwork }
            })

            if (error) {
                throw error
            }

            setNetwork(newNetwork)
            setSuccessMessage(`Switched to Robinhood Chain ${newNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}`)

            router.refresh()
        } catch (err: any) {
            console.error('Failed to update network:', err)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Network Settings</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Choose which network the agent interacts with.</p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleNetworkChange('testnet')}
                        disabled={isUpdating}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${network === 'testnet'
                            ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/40'
                            : 'bg-[#1c1c1f]/30 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${network === 'testnet'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-white/5 text-zinc-400'
                                }`}>
                                <FiGlobe size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">Robinhood Chain Testnet</span>
                                <span className="text-xs text-zinc-500 mt-1">Chain ID: 46630. For development and safe testing.</span>
                            </div>
                        </div>
                        {network === 'testnet' && (
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <FiCheck size={12} />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => handleNetworkChange('mainnet')}
                        disabled={isUpdating}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${network === 'mainnet'
                            ? 'bg-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/40'
                            : 'bg-[#1c1c1f]/30 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${network === 'mainnet'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-white/5 text-zinc-400'
                                }`}>
                                <FiGlobe size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">Robinhood Chain Mainnet</span>
                                <span className="text-xs text-zinc-500 mt-1">Chain ID: 4663. For real transactions.</span>
                            </div>
                        </div>
                        {network === 'mainnet' && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                                <FiCheck size={12} />
                            </div>
                        )}
                    </button>
                </div>

                {isUpdating && (
                    <div className="text-xs text-zinc-500 animate-pulse flex items-center gap-2 mt-2">
                        Updating active network...
                    </div>
                )}

                {successMessage && !isUpdating && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl mt-2">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    )
}
