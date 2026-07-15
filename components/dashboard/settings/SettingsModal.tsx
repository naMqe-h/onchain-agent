'use client'

import { FiX, FiCreditCard, FiLock, FiGlobe } from 'react-icons/fi'
import { User } from '@supabase/supabase-js'
import { useSettingsStore } from '../../../hooks/useSettingsStore'
import WalletsTab from './WalletsTab'
import SecurityTab from './SecurityTab'
import NetworkTab from './NetworkTab'

interface SettingsModalProps {
    user: User | null
}

export default function SettingsModal({ user }: SettingsModalProps) {
    const { isOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore()

    if (!isOpen || !user) return null

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={closeSettings}
        >
            <div
                className="bg-[#18181b] border border-white/10 rounded-[24px] w-full max-w-3xl h-[500px] flex overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-[240px] p-5 flex flex-col gap-4 bg-[#141416]/50 border-r border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={closeSettings}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                            <FiX size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('wallets')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === 'wallets'
                                    ? 'bg-white/10 text-zinc-100'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                            }`}
                        >
                            <FiCreditCard size={16} className={activeTab === 'wallets' ? 'text-zinc-200' : 'text-zinc-400'} />
                            <span>Wallets</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === 'security'
                                    ? 'bg-white/10 text-zinc-100'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                            }`}
                        >
                            <FiLock size={16} className={activeTab === 'security' ? 'text-zinc-200' : 'text-zinc-400'} />
                            <span>Security</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('network')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === 'network'
                                    ? 'bg-white/10 text-zinc-100'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                            }`}
                        >
                            <FiGlobe size={16} className={activeTab === 'network' ? 'text-zinc-200' : 'text-zinc-400'} />
                            <span>Network</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 flex flex-col bg-[#18181b] overflow-hidden">
                    {activeTab === 'wallets' ? (
                        <WalletsTab user={user} />
                    ) : activeTab === 'security' ? (
                        <SecurityTab user={user} />
                    ) : (
                        <NetworkTab user={user} />
                    )}
                </div>
            </div>
        </div>
    )
}
