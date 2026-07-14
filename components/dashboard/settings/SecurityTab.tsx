import { User } from '@supabase/supabase-js'
import { FiLock } from 'react-icons/fi'

interface SecurityTabProps {
    user: User
}

export default function SecurityTab({ user }: { user: User | null }) {
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-medium text-zinc-100">Security</h2>
            <div className="h-px bg-white/5 my-3" />
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center">
                <FiLock size={40} className="mb-3 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-400">Security Settings</p>
                <p className="text-xs text-zinc-600 mt-1">Authentication, session control and safety.</p>
            </div>
        </div>
    )
}
