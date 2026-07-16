import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import { redirect } from 'next/navigation'
import { getUserChats } from '@/app/actions/chat/chat'
import { getOrCreateProfile } from '@/app/actions/profile/profile'
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

  const [chats, profile] = await Promise.all([
    getUserChats(user.id),
    getOrCreateProfile(),
  ])

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <Sidebar user={user} chats={chats} profile={profile} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <SettingsModal user={user} profile={profile} />
    </div>
  )
}
