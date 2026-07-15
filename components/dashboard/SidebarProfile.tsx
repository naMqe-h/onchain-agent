import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { FiMoreHorizontal, FiUser, FiSettings, FiLogOut, FiChevronRight } from 'react-icons/fi'
import { createClient } from '../../lib/supabase/client'
import { useSettingsStore } from '../../hooks/useSettingsStore'

export default function SidebarProfile({ user }: { user: User | null }) {
    const [isOpen, setIsOpen] = useState(false)
    const openSettings = useSettingsStore((state) => state.openSettings)
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

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <div ref={containerRef} className="px-3 pb-4 relative">
            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full left-3 right-3 mb-2 bg-[#1e1e20] border border-white/10 rounded-2xl shadow-2xl z-50 py-2 flex flex-col"
                >
                    <div className="flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors cursor-pointer group rounded-xl mx-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-medium text-white shrink-0 shadow-inner">
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-zinc-200 truncate">
                                    {user.email?.split('@')[0]}
                                </span>
                                <span className="text-[11px] text-zinc-500 truncate">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                        <FiChevronRight size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                    </div>

                    <div className="h-px bg-white/5 my-1.5" />

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-[calc(100%-16px)] mx-2 text-left px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-zinc-100 flex items-center gap-3 rounded-xl cursor-pointer transition-colors"
                    >
                        <FiUser size={16} className="text-zinc-400" />
                        Profile
                    </button>

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
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-medium text-white shrink-0 shadow-inner">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
                            {user.email?.split('@')[0]}
                        </span>
                        <span className={`text-[10px] font-medium leading-none mt-0.5 ${(user.user_metadata?.activeNetwork || 'testnet') === 'mainnet'
                                ? 'text-indigo-400'
                                : 'text-amber-500'
                            }`}>
                            {(user.user_metadata?.activeNetwork || 'testnet') === 'mainnet' ? 'Robinhood Mainnet' : 'Robinhood Testnet'}
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
