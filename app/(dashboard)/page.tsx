import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Chat from '@/components/chat/Chat'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <Chat
            chatId={null}
            initialMessages={[]}
            initialSession={{ streamIndex: 0 }}
            initialModel="gpt-4.1-nano"
        />
    )
}
