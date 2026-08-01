'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FiSearch,
    FiX,
    FiPlus,
    FiCopy,
    FiCheck,
    FiCreditCard,
    FiGlobe,
    FiMessageSquare,
    FiUser,
    FiCpu,
    FiShield,
    FiActivity,
    FiBookOpen,
    FiArchive,
    FiKey,
    FiLayers,
} from 'react-icons/fi'
import { useCommandPaletteStore } from '../../hooks/useCommandPaletteStore'
import { useWalletStore } from '../../hooks/useWalletStore'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { createClient } from '../../lib/supabase/client'
import {
    NETWORK_OPTIONS,
    getNetworkIconSrc,
    normalizeNetworkId,
    type NetworkId,
} from '../../lib/web3/config'
import { searchChats } from '../../app/actions/chat/chat'
import { type Chat, type ChatSearchResult, type SettingsTab } from '@/types'
import { fadeInOut, scaleIn } from '../../lib/motion'

interface CommandPaletteModalProps {
    user: User | null
    chats?: Chat[]
}

interface PaletteItem {
    id: string
    category: 'actions' | 'wallets' | 'networks' | 'settings' | 'chats'
    categoryLabel: string
    title: string
    subtitle?: string
    icon: React.ReactNode
    badge?: string
    badgeColor?: string
    isActive?: boolean
    onSelect: () => void | Promise<void>
}

const SETTINGS_NAV_ITEMS: {
    tab: SettingsTab
    label: string
    description: string
    icon: React.ReactNode
}[] = [
        {
            tab: 'profile',
            label: 'User Profile',
            description: 'Account details, display name, and avatar',
            icon: <FiUser size={15} />,
        },
        {
            tab: 'wallets',
            label: 'EVM Wallets',
            description: 'Manage connected wallets and private keys',
            icon: <FiCreditCard size={15} />,
        },
        {
            tab: 'network',
            label: 'Default EVM Network',
            description: 'Set default blockchain network for new chats',
            icon: <FiGlobe size={15} />,
        },
        {
            tab: 'models',
            label: 'AI Models',
            description: 'AI provider configuration and model selection',
            icon: <FiCpu size={15} />,
        },
        {
            tab: 'security',
            label: 'Security',
            description: 'Password management, encryption, and auth settings',
            icon: <FiShield size={15} />,
        },
        {
            tab: 'sessions',
            label: 'Sessions & Keys',
            description: 'Active browser sessions and security permissions',
            icon: <FiKey size={15} />,
        },
        {
            tab: 'usage',
            label: 'Usage & Analytics',
            description: 'AI token consumption and activity summary',
            icon: <FiActivity size={15} />,
        },
        {
            tab: 'addressBook',
            label: 'Address Book',
            description: 'Saved EVM recipient addresses and contacts',
            icon: <FiBookOpen size={15} />,
        },
        {
            tab: 'coinBook',
            label: 'Coin Book',
            description: 'Custom watchlist of tracked ERC-20 tokens',
            icon: <FiLayers size={15} />,
        },
        {
            tab: 'archived',
            label: 'Archived Chats',
            description: 'Browse and restore archived conversations',
            icon: <FiArchive size={15} />,
        },
    ]

export default function CommandPaletteModal({ user, chats = [] }: CommandPaletteModalProps) {
    const router = useRouter()
    const { isOpen, close } = useCommandPaletteStore()
    const { wallets, selectedAddress, setSelectedAddress } = useWalletStore()
    const { openSettings } = useSettingsStore()

    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [copied, setCopied] = useState(false)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    const [activeNetwork, setActiveNetwork] = useState<NetworkId>(
        normalizeNetworkId(user?.user_metadata?.defaultNetwork || user?.user_metadata?.activeNetwork)
    )

    useEffect(() => {
        if (user?.user_metadata?.defaultNetwork || user?.user_metadata?.activeNetwork) {
            setActiveNetwork(
                normalizeNetworkId(user?.user_metadata?.defaultNetwork || user?.user_metadata?.activeNetwork)
            )
        }
    }, [user])

    useEffect(() => {
        if (!isOpen) return
        setQuery('')
        setSelectedIndex(0)
        setStatusMessage(null)
        setCopied(false)
        const t = setTimeout(() => inputRef.current?.focus(), 40)
        return () => clearTimeout(t)
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const trimmed = query.trim()
        if (trimmed.length < 2) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        let cancelled = false
        setIsSearching(true)
        const timer = setTimeout(async () => {
            try {
                const res = await searchChats(trimmed)
                if (!cancelled) {
                    setSearchResults(res)
                    setIsSearching(false)
                }
            } catch {
                if (!cancelled) {
                    setSearchResults([])
                    setIsSearching(false)
                }
            }
        }, 250)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [query, isOpen])

    const handleCopyAddress = () => {
        if (!selectedAddress) return
        navigator.clipboard.writeText(selectedAddress)
        setCopied(true)
        setStatusMessage('Address copied to clipboard!')
        setTimeout(() => {
            setCopied(false)
            setStatusMessage(null)
        }, 2000)
    }

    const handleNetworkChange = async (netId: NetworkId) => {
        if (netId === activeNetwork) {
            close()
            return
        }
        try {
            const supabase = createClient()
            await supabase.auth.updateUser({
                data: {
                    defaultNetwork: netId,
                    activeNetwork: netId,
                },
            })
            setActiveNetwork(netId)
            setStatusMessage(`Default network switched to ${netId}`)
            router.refresh()
            setTimeout(() => {
                close()
            }, 400)
        } catch {
            setStatusMessage('Failed to update network')
        }
    }

    const items = useMemo(() => {
        const q = query.trim().toLowerCase()
        const list: PaletteItem[] = []

        if (!q || 'new chat create start'.includes(q)) {
            list.push({
                id: 'action-new-chat',
                category: 'actions',
                categoryLabel: 'Quick Actions',
                title: 'New Chat',
                subtitle: 'Start a new conversation with Web3 agent',
                icon: <FiPlus size={16} className="text-emerald-400" />,
                onSelect: () => {
                    close()
                    router.push('/')
                },
            })
        }

        if (selectedAddress && (!q || 'copy wallet address'.includes(q) || selectedAddress.toLowerCase().includes(q))) {
            const shortAddr = `${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)}`
            list.push({
                id: 'action-copy-address',
                category: 'actions',
                categoryLabel: 'Quick Actions',
                title: 'Copy active wallet address',
                subtitle: shortAddr,
                icon: copied ? <FiCheck size={16} className="text-emerald-400" /> : <FiCopy size={16} className="text-indigo-400" />,
                onSelect: handleCopyAddress,
            })
        }

        if (wallets.length > 0) {
            wallets.forEach((w) => {
                const isSelected = selectedAddress?.toLowerCase() === w.address.toLowerCase()
                const shortAddr = `${w.address.slice(0, 6)}...${w.address.slice(-4)}`
                if (!q || w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q) || 'wallet evm address'.includes(q)) {
                    list.push({
                        id: `wallet-${w.id}`,
                        category: 'wallets',
                        categoryLabel: 'EVM Wallets',
                        title: w.name || 'EVM Wallet',
                        subtitle: shortAddr,
                        icon: <FiCreditCard size={16} className={isSelected ? 'text-amber-400' : 'text-zinc-400'} />,
                        badge: isSelected ? 'Active' : undefined,
                        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                        isActive: isSelected,
                        onSelect: () => {
                            setSelectedAddress(w.address)
                            setStatusMessage(`Active wallet set to: ${w.name || shortAddr}`)
                            setTimeout(() => close(), 300)
                        },
                    })
                }
            })
        }

        NETWORK_OPTIONS.forEach((net) => {
            const isSelected = activeNetwork === net.id
            if (!q || net.label.toLowerCase().includes(q) || net.id.toLowerCase().includes(q) || 'network mainnet testnet chain'.includes(q)) {
                list.push({
                    id: `network-${net.id}`,
                    category: 'networks',
                    categoryLabel: 'EVM Networks',
                    title: net.label,
                    subtitle: `Chain ID: ${net.chainId} • ${net.environment}`,
                    icon: (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={getNetworkIconSrc(net.id)}
                            alt=""
                            className="w-4 h-4 object-contain"
                        />
                    ),
                    badge: isSelected ? 'Default' : undefined,
                    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                    isActive: isSelected,
                    onSelect: () => handleNetworkChange(net.id),
                })
            }
        })

        SETTINGS_NAV_ITEMS.forEach((nav) => {
            if (!q || nav.label.toLowerCase().includes(q) || nav.description.toLowerCase().includes(q) || 'settings preferences'.includes(q)) {
                list.push({
                    id: `setting-${nav.tab}`,
                    category: 'settings',
                    categoryLabel: 'Settings',
                    title: nav.label,
                    subtitle: nav.description,
                    icon: <span className="text-zinc-400">{nav.icon}</span>,
                    onSelect: () => {
                        close()
                        openSettings(nav.tab)
                    },
                })
            }
        })

        if (q.length >= 2 && searchResults.length > 0) {
            searchResults.forEach((res) => {
                list.push({
                    id: `search-chat-${res.chatId}`,
                    category: 'chats',
                    categoryLabel: 'Chat Search Results',
                    title: res.title,
                    subtitle: res.snippet || 'Jump to chat',
                    icon: <FiMessageSquare size={15} className="text-cyan-400" />,
                    onSelect: () => {
                        close()
                        router.push(`/chat/${res.chatId}`)
                    },
                })
            })
        } else if (chats.length > 0) {
            const filteredChats = chats.filter(c => !q || c.title.toLowerCase().includes(q)).slice(0, 5)
            filteredChats.forEach((c) => {
                list.push({
                    id: `chat-${c.id}`,
                    category: 'chats',
                    categoryLabel: 'Chat History',
                    title: c.title || 'Untitled chat',
                    subtitle: c.pinnedAt ? 'Pinned chat' : undefined,
                    icon: <FiMessageSquare size={15} className="text-zinc-400" />,
                    badge: c.pinnedAt ? 'Pinned' : undefined,
                    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    onSelect: () => {
                        close()
                        router.push(`/chat/${c.id}`)
                    },
                })
            })
        }

        return list
    }, [query, selectedAddress, wallets, activeNetwork, searchResults, chats, copied])

    useEffect(() => {
        setSelectedIndex(0)
    }, [items.length])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (items.length === 0) {
            if (e.key === 'Escape') close()
            return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev + 1) % items.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const selected = items[selectedIndex]
            if (selected) {
                selected.onSelect()
            }
        } else if (e.key === 'Escape') {
            e.preventDefault()
            close()
        }
    }

    useEffect(() => {
        if (!listRef.current) return
        const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    }, [selectedIndex])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    variants={fadeInOut}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-70 flex items-start justify-center bg-black/75 backdrop-blur-md p-4 pt-[10vh] sm:pt-[12vh]"
                    onClick={(e) => {
                        if (e.target === backdropRef.current) close()
                    }}
                >
                    <motion.div
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-xl rounded-2xl bg-[#141416] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[min(75vh,580px)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 bg-[#18181b]/50">
                            <FiSearch size={18} className="shrink-0 text-zinc-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a command, search chats, wallets, EVM networks, or settings..."
                                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0 p-0"
                                aria-label="Command Palette input"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-zinc-400 bg-white/5 border border-white/10 rounded-md">
                                    Esc
                                </kbd>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                    aria-label="Close Command Palette"
                                >
                                    <FiX size={16} />
                                </button>
                            </div>
                        </div>

                        {statusMessage && (
                            <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                                <span>{statusMessage}</span>
                            </div>
                        )}

                        <div
                            ref={listRef}
                            className="flex-1 overflow-y-auto min-h-0 px-2 py-2.5 space-y-4"
                        >
                            {isSearching && (
                                <div className="px-3 py-6 text-xs text-zinc-500 text-center animate-pulse">
                                    Searching database...
                                </div>
                            )}

                            {!isSearching && items.length === 0 && (
                                <div className="px-3 py-8 text-sm text-zinc-500 text-center">
                                    No results found for &quot;{query}&quot;
                                </div>
                            )}

                            {!isSearching && items.length > 0 && (
                                (() => {
                                    let globalIdx = 0
                                    const categories = Array.from(new Set(items.map((i) => i.categoryLabel)))

                                    return categories.map((catLabel) => {
                                        const categoryItems = items.filter((i) => i.categoryLabel === catLabel)

                                        return (
                                            <div key={catLabel} className="space-y-1">
                                                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                                                    {catLabel}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {categoryItems.map((item) => {
                                                        const currentIdx = globalIdx++
                                                        const isFocused = currentIdx === selectedIndex

                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                data-index={currentIdx}
                                                                onClick={() => item.onSelect()}
                                                                onMouseEnter={() => setSelectedIndex(currentIdx)}
                                                                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer group ${isFocused
                                                                    ? 'bg-indigo-500/15 text-zinc-100 border border-indigo-500/30 shadow-sm'
                                                                    : 'text-zinc-300 hover:bg-white/5 border border-transparent'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <div
                                                                        className={`p-2 rounded-lg shrink-0 ${isFocused
                                                                            ? 'bg-indigo-500/20 text-indigo-300'
                                                                            : 'bg-white/5 text-zinc-400 group-hover:text-zinc-200'
                                                                            }`}
                                                                    >
                                                                        {item.icon}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <span className="font-medium text-xs sm:text-sm truncate">
                                                                            {item.title}
                                                                        </span>
                                                                        {item.subtitle && (
                                                                            <span className="text-[11px] text-zinc-500 truncate mt-0.5">
                                                                                {item.subtitle}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {item.badge && (
                                                                    <span
                                                                        className={`ml-2 px-2 py-0.5 text-[10px] font-medium border rounded-full shrink-0 ${item.badgeColor || 'bg-white/5 text-zinc-400 border-white/10'
                                                                            }`}
                                                                    >
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })
                                })()
                            )}
                        </div>

                        <div className="px-4 py-2.5 border-t border-white/8 bg-[#18181b]/40 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[10px]">
                                        ↑
                                    </kbd>
                                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[10px]">
                                        ↓
                                    </kbd>
                                    <span>Navigate</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm font-mono text-[10px]">
                                        ↵
                                    </kbd>
                                    <span>Select</span>
                                </span>
                            </div>

                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
