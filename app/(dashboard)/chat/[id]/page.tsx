import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getChatWithMessages } from '../../../actions/chat/chat'
import Chat from '../../../../components/chat/Chat'

interface ChatPageProps {
    params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const chat = await getChatWithMessages(id, user.id)

    if (!chat) {
        redirect('/')
    }

    const initialSession = chat.eveSessionId
        ? {
            sessionId: chat.eveSessionId,
            continuationToken: chat.eveContinuationToken ?? undefined,
            streamIndex: chat.eveStreamIndex
        }
        : { streamIndex: 0 }

    const activeNetwork = user?.user_metadata?.activeNetwork || 'testnet'

    return (
        <Chat
            chatId={chat.id}
            initialMessages={chat.messages.map(m => ({
                ...m,
                role: m.role as 'user' | 'assistant'
            }))}
            initialSession={initialSession}
            initialModel={chat.model}
            activeNetwork={activeNetwork}
        />
    )
}
