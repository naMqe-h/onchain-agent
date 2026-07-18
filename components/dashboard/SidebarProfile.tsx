import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { FiMoreHorizontal, FiSettings, FiLogOut } from 'react-icons/fi'
import { createClient } from '../../lib/supabase/client'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { PublicProfile } from '../../app/actions/profile/profile'
import {
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
    type NetworkId,
} from '../../lib/web3/config'

const NETWORK_BADGE_CLASS: Record<NetworkId, string> = {
    'robinhood-testnet': 'text-amber-500',
    'robinhood-mainnet': 'text-indigo-400',
    ethereum: 'text-blue-400',
    'ethereum-sepolia': 'text-sky-400',
    polygon: 'text-violet-400',
}

export default function SidebarProfile({
    user,
    profile,
    collapsed = false,
}: {
    user: User | null
    profile: PublicProfile | null
    collapsed?: boolean
}) {
    const [isOpen, setIsOpen] = useState(false)
    const openSettings = useSettingsStore((state) => state.openSettings)
    const openAuthModal = useAuthModalStore((state) => state.open)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (!user) return null

    const displayName =
        profile?.displayName || user.email?.split('@')[0] || 'User'
    const avatarUrl = profile?.avatarUrl
    const initial = displayName.charAt(0).toUpperCase()
    const activeNetwork = user.user_metadata?.activeNetwork

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
        openAuthModal()
    }

    const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
        const dim = size === 'md' ? 'w-8 h-8 text-xs' : 'w-8 h-8 text-xs'
        if (avatarUrl) {
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={avatarUrl}
                    alt={displayName}
                    className={`${dim} rounded-full object-cover shrink-0 shadow-inner border border-white/10`}
                />
            )
        }
        return (
            <div
                className={`${dim} rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center font-medium text-white shrink-0 shadow-inner`}
            >
                {initial}
            </div>
        )
    }

    const menuPanel = isOpen && (
        <div
            onClick={(e) => e.stopPropagation()}
            className={
                collapsed
                    ? 'absolute bottom-0 left-full ml-2 w-56 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 flex flex-col'
                    : 'absolute bottom-full left-3 right-3 mb-2 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 flex flex-col'
            }
        >
            <div className="flex items-center justify-between p-2.5 rounded-xl mx-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar size="md" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-zinc-200 truncate">
                            {displayName}
                        </span>
                        <span className="text-[11px] text-zinc-500 truncate">
                            {user.email}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/5 my-1.5" />

            <button
                onClick={() => {
                    setIsOpen(false)
                    openSettings()
                }}
                className="w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-3 rounded-xl cursor-pointer transition-colors"
            >
                <FiSettings size={16} className="text-zinc-400" />
                Settings
            </button>

            <div className="h-px bg-white/5 my-1.5" />

            <button
                onClick={handleLogout}
                className="w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 rounded-xl cursor-pointer transition-colors"
            >
                <FiLogOut size={16} />
                Log out
            </button>
        </div>
    )

    if (collapsed) {
        return (
            <div ref={containerRef} className="px-1 pb-4 relative flex justify-center">
                {menuPanel}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-1.5 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer"
                    aria-label="Open profile menu"
                    title={displayName}
                >
                    <span className="relative inline-block">
                        <Avatar />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#131314] border border-white/10 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getNetworkIconSrc(activeNetwork)}
                                alt=""
                                className="w-2.5 h-2.5 object-contain"
                                aria-hidden
                            />
                        </span>
                    </span>
                </button>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="px-3 pb-4 relative">
            {menuPanel}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar />
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                            {displayName}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] font-medium leading-none mt-0.5 ${NETWORK_BADGE_CLASS[
                                normalizeNetworkId(activeNetwork)
                                ]
                                }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getNetworkIconSrc(activeNetwork)}
                                alt=""
                                className="w-3 h-3 object-contain shrink-0 rounded-sm"
                                aria-hidden
                            />
                            {getNetworkShortLabel(activeNetwork)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(!isOpen)
                    }}
                    className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                    <FiMoreHorizontal size={18} />
                </button>
            </div>
        </div>
    )
}
