import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import { redirect } from 'next/navigation'
import { getUserChats } from '@/app/actions/chat/chat'
import SettingsModal from '../../components/dashboard/settings/SettingsModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const chats = await getUserChats(user.id)

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar user={user} chats={chats} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <SettingsModal user={user} />
    </div>
  )
}
