import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { FiMoreHorizontal, FiSettings, FiLogOut, FiAlertTriangle, FiLayers } from 'react-icons/fi'
import { createClient } from '../../lib/supabase/client'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { useWalletStore } from '../../hooks/useWalletStore'
import { PublicProfile } from '../../app/actions/profile/profile'
import { checkMyUsageQuota } from '../../app/actions/usage/usage'
import type { QuotaCheckResult } from '../../lib/usage/checkQuota'
import {
    getNetworkIconSrc,
    getNetworkShortLabel,
    normalizeNetworkId,
    type NetworkId,
} from '../../lib/web3/config'
import FeaturesModal from './FeaturesModal'

type DailyUsageAlert = {
    level: 'soft' | 'hard'
    percentUsed: number
}

function dailyUsageAlert(
    quota: QuotaCheckResult | null
): DailyUsageAlert | null {
    if (!quota) return null
    const { usage } = quota

    const tokenPct =
        usage.tokensPerDayLimit > 0
            ? (usage.tokensToday / usage.tokensPerDayLimit) * 100
            : 0
    const requestPct =
        usage.requestsPerDayLimit > 0
            ? (usage.requestsToday / usage.requestsPerDayLimit) * 100
            : 0
    const percentUsed = Math.min(100, Math.round(Math.max(tokenPct, requestPct)))

    if (
        usage.tokensToday >= usage.tokensPerDayLimit ||
        usage.requestsToday >= usage.requestsPerDayLimit
    ) {
        return { level: 'hard', percentUsed: Math.max(percentUsed, 100) }
    }
    if (usage.tokensToday >= usage.softTokenThreshold) {
        return { level: 'soft', percentUsed }
    }
    const softRequestThreshold = Math.floor(
        usage.requestsPerDayLimit *
        (usage.tokensPerDayLimit > 0
            ? usage.softTokenThreshold / usage.tokensPerDayLimit
            : 0)
    )
    if (softRequestThreshold > 0 && usage.requestsToday >= softRequestThreshold) {
        return { level: 'soft', percentUsed }
    }
    return null
}

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
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false)
    const [usageAlert, setUsageAlert] = useState<DailyUsageAlert | null>(null)
    const openSettings = useSettingsStore((state) => state.openSettings)
    const openAuthModal = useAuthModalStore((state) => state.open)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const refreshUsageAlert = useCallback(async () => {
        if (!user) {
            setUsageAlert(null)
            return
        }
        try {
            const timeZone =
                typeof Intl !== 'undefined'
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : undefined
            const quota = await checkMyUsageQuota(timeZone)
            setUsageAlert(dailyUsageAlert(quota))
        } catch { }
    }, [user])

    useEffect(() => {
        void refreshUsageAlert()
    }, [refreshUsageAlert])

    useEffect(() => {
        if (isOpen) void refreshUsageAlert()
    }, [isOpen, refreshUsageAlert])

    useEffect(() => {
        function onVisible() {
            if (document.visibilityState === 'visible') {
                void refreshUsageAlert()
            }
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onVisible)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onVisible)
        }
    }, [refreshUsageAlert])

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
        await supabase.auth.signOut({ scope: 'local' })
        useWalletStore.getState().clearWallets()
        useSettingsStore.getState().closeSettings()
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
                    setIsFeaturesOpen(true)
                }}
                className="w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-3 rounded-xl cursor-pointer transition-colors"
            >
                <FiLayers size={16} className="text-zinc-400" />
                Features
            </button>

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
                <FeaturesModal isOpen={isFeaturesOpen} onClose={() => setIsFeaturesOpen(false)} />
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
                <div className="flex items-center gap-1.5 shrink-0">
                    {usageAlert && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                openSettings('usage')
                            }}
                            className={`p-0.5 rounded-md transition-colors cursor-pointer ${usageAlert.level === 'hard'
                                ? 'text-rose-400 hover:text-rose-300'
                                : 'text-amber-400 hover:text-amber-300'
                                }`}
                            title={`Used ${usageAlert.percentUsed}% of daily limit`}
                            aria-label={`Used ${usageAlert.percentUsed}% of daily limit`}
                        >
                            <FiAlertTriangle size={16} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsOpen(!isOpen)
                        }}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                        aria-label="Open profile menu"
                    >
                        <FiMoreHorizontal size={18} />
                    </button>
                </div>
            </div>
            <FeaturesModal isOpen={isFeaturesOpen} onClose={() => setIsFeaturesOpen(false)} />
        </div>
    )
}
