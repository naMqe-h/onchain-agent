import { User } from '@supabase/supabase-js'
import { FiSettings } from 'react-icons/fi'

export default function SidebarProfile({ user }: { user: User | null }) {
  if (!user) return null

  return (
    <div className="px-3 pb-4">
      <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1e1e20] transition-colors cursor-pointer group">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-medium text-white shrink-0 shadow-inner">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">
            {user.email?.split('@')[0]}
          </span>
        </div>
        <button className="text-zinc-500 hover:text-zinc-200 transition-colors">
          <FiSettings size={18} />
        </button>
      </div>
    </div>
  )
}
