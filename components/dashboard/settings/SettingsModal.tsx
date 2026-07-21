'use client'

import { ReactNode } from 'react'
import { FiX, FiCreditCard, FiLock, FiGlobe, FiUser, FiCpu, FiArchive, FiBook, FiDisc, FiMonitor, FiBarChart2 } from 'react-icons/fi'
import { User } from '@supabase/supabase-js'
import { useSettingsStore } from '../../../hooks/useSettingsStore'
import { type SettingsTab, type PublicProfile } from '@/types'
import WalletsTab from './WalletsTab'
import AddressBookTab from './AddressBookTab'
import CoinBookTab from './CoinBookTab'
import SecurityTab from './SecurityTab'
import SessionsTab from './SessionsTab'
import NetworkTab from './NetworkTab'
import ProfileTab from './ProfileTab'
import ModelsTab from './ModelsTab'
import UsageTab from './UsageTab'
import ArchivedTab from './ArchivedTab'

interface SettingsModalProps {
    user: User | null
    profile: PublicProfile | null
}

export default function SettingsModal({ user, profile }: SettingsModalProps) {
    const { isOpen, activeTab, closeSettings, setActiveTab } = useSettingsStore()

    if (!isOpen || !user || !profile) return null

    const tabBtn = (tab: SettingsTab, label: string, icon: ReactNode) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 md:gap-3 px-2.5 py-1.5 md:px-3 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-colors cursor-pointer ${activeTab === tab
                ? 'bg-white/10 text-zinc-100'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
        >
            <span className={activeTab === tab ? 'text-zinc-200' : 'text-zinc-400'}>{icon}</span>
            <span>{label}</span>
        </button>
    )

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={closeSettings}
        >
            <div
                className="bg-[#18181b] w-full h-full rounded-none max-w-none border-none md:max-w-4xl md:h-150 md:rounded-3xl md:border md:border-white/10 flex flex-col md:flex-row overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full md:w-60 pt-4 px-4 pb-5 md:p-5 flex flex-row md:flex-col justify-between md:justify-start gap-3 md:gap-4 bg-[#141416]/50 border-b border-white/5 md:border-b-0 md:border-r md:border-white/5 items-center md:items-stretch shrink-0">
                    <div className="flex flex-row md:flex-col gap-1 flex-1 md:flex-initial overflow-x-auto pb-3 md:pb-0 -mb-0.5 md:mb-0">
                        {tabBtn('profile', 'Profile', <FiUser size={16} />)}
                        {tabBtn('wallets', 'Wallets', <FiCreditCard size={16} />)}
                        {tabBtn('addressBook', 'Address Book', <FiBook size={16} />)}
                        {tabBtn('coinBook', 'Coin Book', <FiDisc size={16} />)}
                        {tabBtn('security', 'Security', <FiLock size={16} />)}
                        {tabBtn('sessions', 'Sessions', <FiMonitor size={16} />)}
                        {tabBtn('network', 'Network', <FiGlobe size={16} />)}
                        {tabBtn('models', 'Models', <FiCpu size={16} />)}
                        {tabBtn('usage', 'Usage', <FiBarChart2 size={16} />)}
                        {tabBtn('archived', 'Archived', <FiArchive size={16} />)}
                    </div>

                    <div className="flex items-center md:mb-2 md:order-first">
                        <button
                            onClick={closeSettings}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 flex flex-col bg-[#18181b] overflow-hidden">
                    {activeTab === 'profile' ? (
                        <ProfileTab user={user} profile={profile} />
                    ) : activeTab === 'wallets' ? (
                        <WalletsTab user={user} />
                    ) : activeTab === 'addressBook' ? (
                        <AddressBookTab />
                    ) : activeTab === 'coinBook' ? (
                        <CoinBookTab user={user} />
                    ) : activeTab === 'security' ? (
                        <SecurityTab user={user} />
                    ) : activeTab === 'sessions' ? (
                        <SessionsTab />
                    ) : activeTab === 'models' ? (
                        <ModelsTab user={user} />
                    ) : activeTab === 'usage' ? (
                        <UsageTab />
                    ) : activeTab === 'archived' ? (
                        <ArchivedTab user={user} />
                    ) : (
                        <NetworkTab user={user} />
                    )}
                </div>
            </div>
        </div>
    )
}
