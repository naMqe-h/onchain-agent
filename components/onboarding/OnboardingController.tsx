'use client'

import { useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { useOnboardingStore } from '../../hooks/useOnboardingStore'
import WelcomeOnboardingModal from './WelcomeOnboardingModal'

interface OnboardingControllerProps {
    user: User | null
}

export default function OnboardingController({ user }: OnboardingControllerProps) {
    const hasCompletedWelcome = useOnboardingStore((s) => s.hasCompletedWelcome)
    const openWelcome = useOnboardingStore((s) => s.openWelcome)
    const completeWelcome = useOnboardingStore((s) => s.completeWelcome)
    const checkedServerRef = useRef(false)

    useEffect(() => {
        if (!user || checkedServerRef.current) return
        checkedServerRef.current = true

        const serverHasCompleted = !!user.user_metadata?.hasCompletedWelcome

        if (serverHasCompleted) {
            if (!hasCompletedWelcome) {
                completeWelcome()
            }
            return
        }

        if (!hasCompletedWelcome) {
            const timer = setTimeout(() => {
                openWelcome()
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [user, hasCompletedWelcome, openWelcome, completeWelcome])

    return <WelcomeOnboardingModal user={user} />
}
