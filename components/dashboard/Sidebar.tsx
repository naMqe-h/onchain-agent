import { User } from '@supabase/supabase-js'
import SidebarProfile from './SidebarProfile'

export default function Sidebar({ user }: { user: User | null }) {
  return (
    <div className="w-64 h-screen border-r border-white/5 bg-[#131314] flex flex-col">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="flex items-center mb-8 px-2 cursor-pointer select-none">
          <span className="font-medium text-[17px] text-zinc-100 tracking-tight">Robinhood Agent</span>
        </div>

        <nav className="flex flex-col gap-1 px-2">
        </nav>
      </div>

      <SidebarProfile user={user} />
    </div>
  )
}
