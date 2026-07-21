import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiCheck } from 'react-icons/fi'
import { createClient } from '../../../lib/supabase/client'
import {
    NETWORK_OPTIONS,
    NETWORK_SECTIONS,
    getNetworkIconSrc,
    normalizeNetworkId,
    type NetworkId,
    type NetworkOption,
} from '../../../lib/web3/config'

interface NetworkTabProps {
    user: User | null
}

const ACCENT_SELECTED: Record<string, string> = {
    amber: 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/40',
    indigo: 'bg-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/40',
    blue: 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/40',
    sky: 'bg-sky-500/5 border-sky-500/30 hover:border-sky-500/40',
    violet: 'bg-violet-500/5 border-violet-500/30 hover:border-violet-500/40',
}

const ACCENT_ICON: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    blue: 'bg-blue-500/10 text-blue-400',
    sky: 'bg-sky-500/10 text-sky-400',
    violet: 'bg-violet-500/10 text-violet-400',
}

const ACCENT_CHECK: Record<string, string> = {
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    indigo: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    sky: 'bg-sky-500/20 border-sky-500/30 text-sky-400',
    violet: 'bg-violet-500/20 border-violet-500/30 text-violet-400',
}

function NetworkOptionRow({
    option,
    selected,
    isUpdating,
    onSelect,
}: {
    option: NetworkOption
    selected: boolean
    isUpdating: boolean
    onSelect: (id: NetworkId) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={isUpdating}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${selected
                    ? ACCENT_SELECTED[option.accent]
                    : 'bg-[#1c1c1f]/30 border-white/5 hover:border-white/10'
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${selected
                            ? ACCENT_ICON[option.accent]
                            : 'bg-white/5 text-zinc-400'
                        }`}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={getNetworkIconSrc(option.id)}
                        alt=""
                        className="w-5 h-5 object-contain"
                        aria-hidden
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-200">
                        {option.label}
                    </span>
                    <span className="text-xs text-zinc-500 mt-1">
                        Chain ID: {option.chainId}
                    </span>
                </div>
            </div>
            {selected && (
                <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${ACCENT_CHECK[option.accent]}`}
                >
                    <FiCheck size={12} />
                </div>
            )}
        </button>
    )
}

export default function NetworkTab({ user }: NetworkTabProps) {
    const router = useRouter()
    const initialNetwork = normalizeNetworkId(
        user?.user_metadata?.defaultNetwork || user?.user_metadata?.activeNetwork
    )
    const [network, setNetwork] = useState<NetworkId>(initialNetwork)
    const [isUpdating, setIsUpdating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const handleNetworkChange = async (newNetwork: NetworkId) => {
        if (isUpdating || newNetwork === network) return

        setIsUpdating(true)
        setSuccessMessage('')
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                data: {
                    defaultNetwork: newNetwork,
                    activeNetwork: newNetwork,
                },
            })

            if (error) {
                throw error
            }

            const option = NETWORK_OPTIONS.find((o) => o.id === newNetwork)
            setNetwork(newNetwork)
            setSuccessMessage(`Default network for new chats set to ${option?.label ?? newNetwork}`)

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
                <h2 className="text-lg font-medium text-zinc-100">Default Network Settings</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Choose the default network for new conversations.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-6">
                {NETWORK_SECTIONS.map((section) => {
                    const options = NETWORK_OPTIONS.filter(
                        (o) => o.environment === section.id
                    )

                    return (
                        <section key={section.id} className="flex flex-col gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-100">
                                    {section.title}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                    {section.description}
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {options.map((option) => (
                                    <NetworkOptionRow
                                        key={option.id}
                                        option={option}
                                        selected={network === option.id}
                                        isUpdating={isUpdating}
                                        onSelect={handleNetworkChange}
                                    />
                                ))}
                            </div>
                        </section>
                    )
                })}

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
