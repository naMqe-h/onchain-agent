import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import { getUserChats } from '@/app/actions/chat/chat'
import { getOrCreateProfile } from '@/app/actions/profile/profile'
import SettingsModal from '../../components/dashboard/settings/SettingsModal'
import LoginModal from '../../components/auth/LoginModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [chats, profile] = user
    ? await Promise.all([getUserChats(user.id), getOrCreateProfile()])
    : [[], null]

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <Sidebar user={user} chats={chats} profile={profile} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      {user && <SettingsModal user={user} profile={profile} />}
      <LoginModal />
    </div>
  )
}
