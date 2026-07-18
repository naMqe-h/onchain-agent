import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import { getUserChats, getUserFolders } from '@/app/actions/chat/chat'
import { getOrCreateProfile } from '@/app/actions/profile/profile'
import { fetchModelCatalog } from '@/app/actions/models/models'
import SettingsModal from '../../components/dashboard/settings/SettingsModal'
import LoginModal from '../../components/auth/LoginModal'
import AuthSessionWatcher from '../../components/auth/AuthSessionWatcher'
import ModelsBootstrap from '../../components/dashboard/ModelsBootstrap'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [chats, folders, profile, modelCatalog] = user
    ? await Promise.all([
        getUserChats(user.id),
        getUserFolders(user.id),
        getOrCreateProfile(),
        fetchModelCatalog(),
      ])
    : [[], [], null, []]

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <AuthSessionWatcher />
      <ModelsBootstrap initialModels={modelCatalog} />
      <Sidebar user={user} chats={chats} folders={folders} profile={profile} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      {user && <SettingsModal user={user} profile={profile} />}
      <LoginModal />
    </div>
  )
}
