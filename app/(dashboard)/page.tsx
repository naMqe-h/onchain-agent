import { createClient } from '@/lib/supabase/server'
import Chat from '@/components/chat/Chat'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const activeNetwork = user?.user_metadata?.activeNetwork || 'testnet'
    const defaultModel = user?.user_metadata?.defaultModel || 'gpt-4.1-nano'
    const enabledModels = user?.user_metadata?.enabledModels as string[] | undefined

    return (
        <Chat
            chatId={null}
            initialMessages={[]}
            initialSession={{ streamIndex: 0 }}
            initialModel={defaultModel}
            activeNetwork={activeNetwork}
            userId={user?.id ?? null}
            enabledModels={enabledModels}
        />
    )
}
