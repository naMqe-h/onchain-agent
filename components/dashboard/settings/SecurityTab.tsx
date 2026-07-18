'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { createClient } from '../../../lib/supabase/client'
import {
    normalizeTxConfirmationMode,
    TX_CONFIRMATION_OPTIONS,
    type TxConfirmationMode,
} from '../../../lib/security'

interface SecurityTabProps {
    user: User | null
}

const SELECTED_CARD: Record<TxConfirmationMode, string> = {
    always: 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/40',
    agent_decides: 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500/40',
    never: 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/40',
}

const SELECTED_CHECK: Record<TxConfirmationMode, string> = {
    always: 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400',
    agent_decides: 'border-blue-500/30 bg-blue-500/20 text-blue-400',
    never: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
}

export default function SecurityTab({ user }: SecurityTabProps) {
    const router = useRouter()
    const [mode, setMode] = useState<TxConfirmationMode>(
        normalizeTxConfirmationMode(user?.user_metadata?.txConfirmationMode)
    )
    const [isUpdating, setIsUpdating] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const handleModeChange = async (newMode: TxConfirmationMode) => {
        if (isUpdating || newMode === mode) return

        setIsUpdating(true)
        setSuccessMessage('')
        setErrorMessage('')

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                data: { txConfirmationMode: newMode },
            })

            if (error) {
                throw error
            }

            const option = TX_CONFIRMATION_OPTIONS.find((o) => o.id === newMode)
            setMode(newMode)
            setSuccessMessage(`Transaction confirmations: ${option?.label ?? newMode}`)
            router.refresh()
        } catch (err: unknown) {
            console.error('Failed to update tx confirmation mode:', err)
            setErrorMessage('Failed to update security settings. Please try again.')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Security</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Control when the agent asks for confirmation before on-chain transactions. Read-only tools are never affected.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-medium text-zinc-200">Transaction confirmations</h3>
                    <p className="text-xs text-zinc-500">
                        Applies only after transfer details are clear and only to tools that create
                        on-chain transactions.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {TX_CONFIRMATION_OPTIONS.map((option) => {
                        const selected = mode === option.id
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleModeChange(option.id)}
                                disabled={isUpdating}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                    selected
                                        ? SELECTED_CARD[option.id]
                                        : 'bg-[#1c1c1f]/30 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex flex-col gap-1 pr-3 min-w-0">
                                    <span className="text-sm font-semibold text-zinc-200">
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-zinc-500">{option.description}</span>
                                    {option.warning && selected && (
                                        <span className="text-xs text-amber-400/90 mt-1 flex items-start gap-1.5">
                                            <FiAlertTriangle
                                                size={12}
                                                className="shrink-0 mt-0.5"
                                            />
                                            {option.warning}
                                        </span>
                                    )}
                                </div>
                                {selected && (
                                    <div
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${SELECTED_CHECK[option.id]}`}
                                    >
                                        <FiCheck size={12} />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {isUpdating && (
                    <div className="text-xs text-zinc-500 animate-pulse flex items-center gap-2 mt-2">
                        Updating security settings...
                    </div>
                )}

                {successMessage && !isUpdating && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl mt-2">
                        {successMessage}
                    </div>
                )}

                {errorMessage && !isUpdating && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl mt-2">
                        {errorMessage}
                    </div>
                )}
            </div>
        </div>
    )
}
