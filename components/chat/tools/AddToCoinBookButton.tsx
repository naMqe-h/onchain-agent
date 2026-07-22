'use client'

import { useState } from 'react'
import { FiBook, FiCheck, FiLoader } from 'react-icons/fi'
import { createCoinBookEntry } from '../../../app/actions/coinBook'

interface AddToCoinBookButtonProps {
    address: string
    chain: string
    symbol?: string
    size?: number
    className?: string
}

export default function AddToCoinBookButton({
    address,
    chain,
    symbol,
    size = 14,
    className = '',
}: AddToCoinBookButtonProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [tooltip, setTooltip] = useState<string | null>(null)

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!address || isSaving || isSaved) return

        setIsSaving(true)
        setTooltip(null)

        try {
            const res = await createCoinBookEntry(address, chain)
            if (res.entry) {
                setIsSaved(true)
                setTooltip('Saved to Coin Book!')
                setTimeout(() => setTooltip(null), 2500)
            } else if (res.error) {
                if (res.error.toLowerCase().includes('already saved')) {
                    setIsSaved(true)
                    setTooltip('Already in Coin Book')
                    setTimeout(() => setTooltip(null), 2500)
                } else {
                    setTooltip(res.error)
                    setTimeout(() => setTooltip(null), 3000)
                }
            }
        } catch (err: unknown) {
            setTooltip(err instanceof Error ? err.message : 'Failed to save')
            setTimeout(() => setTooltip(null), 3000)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="relative inline-flex items-center">
            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 rounded transition-colors cursor-pointer disabled:cursor-default ${
                    isSaved ? 'text-emerald-400' : ''
                } ${className}`}
                title={isSaved ? 'Saved in Coin Book' : `Save ${symbol ? symbol : 'token'} to Coin Book`}
                aria-label={`Save ${symbol ? symbol : 'token'} to Coin Book`}
            >
                {isSaving ? (
                    <FiLoader size={size} className="animate-spin text-purple-400" />
                ) : isSaved ? (
                    <FiCheck size={size} className="text-emerald-400" />
                ) : (
                    <FiBook size={size} />
                )}
            </button>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-medium rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none">
                    {tooltip}
                </div>
            )}
        </div>
    )
}
