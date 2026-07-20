'use client'

import { useState } from 'react'
import { FiCopy, FiCheck } from 'react-icons/fi'

interface CopyMessageButtonProps {
    text: string
}

export default function CopyMessageButton({ text }: CopyMessageButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!text.trim()) return
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-[#1e1e20] hover:text-zinc-200"
            title={copied ? 'Copied' : 'Copy message'}
            aria-label={copied ? 'Copied' : 'Copy message'}
        >
            {copied ? <FiCheck size={14} className="text-emerald-400" /> : <FiCopy size={14} />}
        </button>
    )
}
