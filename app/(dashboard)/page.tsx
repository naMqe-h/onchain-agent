import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Chat from '@/components/chat/Chat'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const activeNetwork = user?.user_metadata?.activeNetwork || 'testnet'

    return (
        <Chat
            chatId={null}
            initialMessages={[]}
            initialSession={{ streamIndex: 0 }}
            initialModel="gpt-4.1-nano"
            activeNetwork={activeNetwork}
            userId={user.id}
        />
    )
}
