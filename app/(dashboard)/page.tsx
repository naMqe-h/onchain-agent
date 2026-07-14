'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createChat } from '@/app/actions/chat/chat'
import { FiArrowRight } from 'react-icons/fi'

export default function DashboardPage() {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

    const handleNewChat = async () => {
        if (isCreating) return
        setIsCreating(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const chat = await createChat(user.id)
            router.push(`/chat/${chat.id}`)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#131314] gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">Robinhood Agent</h1>
                <p className="text-zinc-500 text-base max-w-xs">
                    Your AI assistant for on-chain actions on Robinhood Chain.
                </p>
            </div>
            <button
                onClick={handleNewChat}
                disabled={isCreating}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-200 hover:bg-white text-black font-medium text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                <span>{isCreating ? 'Creating chat...' : 'Start New Chat'}</span>
                <FiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    )
}
