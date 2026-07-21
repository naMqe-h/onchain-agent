import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChatWithMessagesAndResolvedModel } from '../../../actions/chat/chat'
import Chat from '../../../../components/chat/Chat'
import { normalizeNetworkId } from '@/lib/web3/config'
import { getUserModelPreferences } from '@/app/actions/models/models'

interface ChatPageProps {
    params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/')
    }

    const prefs = await getUserModelPreferences()
    const chat = await getChatWithMessagesAndResolvedModel(id, user.id, prefs.defaultModelId)

    if (!chat) {
        redirect('/')
    }

    const initialSession = chat.eveSessionId
        ? {
            sessionId: chat.eveSessionId,
            continuationToken: chat.eveContinuationToken ?? undefined,
            streamIndex: chat.eveStreamIndex ?? 0
        }
        : { streamIndex: 0 }

    const activeNetwork = normalizeNetworkId(
        chat.network || user?.user_metadata?.defaultNetwork || user?.user_metadata?.activeNetwork
    )

    return (
        <Chat
            chatId={chat.id}
            initialMessages={chat.messages.map((m) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                parts: m.parts,
                createdAt: m.createdAt,
            }))}
            initialSession={initialSession}
            initialModel={chat.model}
            initialTitle={chat.title}
            activeNetwork={activeNetwork}
            userId={user.id}
            enabledModels={prefs.enabledModelIds}
        />
    )
}
