import { createClient } from '@/lib/supabase/server'
import Chat from '@/components/chat/Chat'
import { normalizeNetworkId } from '@/lib/web3/config'
import { getUserModelPreferences } from '@/app/actions/models/models'
import { DEFAULT_MODEL_ID } from '@/lib/models'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const activeNetwork = normalizeNetworkId(user?.user_metadata?.activeNetwork)

    let defaultModel: string = DEFAULT_MODEL_ID
    let enabledModels: string[] | undefined

    if (user) {
        const prefs = await getUserModelPreferences()
        defaultModel = prefs.defaultModelId
        enabledModels = prefs.enabledModelIds
    }

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
