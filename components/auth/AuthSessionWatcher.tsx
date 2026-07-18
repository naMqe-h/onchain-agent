'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthModalStore } from '@/hooks/useAuthModalStore'
import { useSettingsStore } from '@/hooks/useSettingsStore'
import { useWalletStore } from '@/hooks/useWalletStore'

const POLL_INTERVAL_MS = 15_000

export default function AuthSessionWatcher() {
    const router = useRouter()
    const handlingRef = useRef(false)

    useEffect(() => {
        const supabase = createClient()

        const clearClientState = () => {
            useWalletStore.getState().clearWallets()
            useSettingsStore.getState().closeSettings()
            useAuthModalStore.getState().open()
            router.refresh()
        }

        const forceLocalLogout = async () => {
            if (handlingRef.current) return
            handlingRef.current = true
            try {
                await supabase.auth.signOut({ scope: 'local' })
            } catch {
            } finally {
                clearClientState()
                setTimeout(() => {
                    handlingRef.current = false
                }, 2_000)
            }
        }

        const verifySessionStillValid = async () => {
            if (handlingRef.current) return
            if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
                return
            }

            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) return

            const { data, error } = await supabase.rpc('is_my_current_session_valid')

            if (error) {
                if (
                    error.message?.includes('function') ||
                    error.code === 'PGRST202' ||
                    error.code === '42883'
                ) {
                    const { error: refreshError } = await supabase.auth.refreshSession()
                    if (refreshError) {
                        await forceLocalLogout()
                    }
                    return
                }

                const status = (error as { status?: number }).status
                if (status === 401 || status === 403) {
                    await forceLocalLogout()
                }
                return
            }

            if (data === false) {
                await forceLocalLogout()
            }
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                if (handlingRef.current) return
                clearClientState()
            }
        })

        const initialTimer = window.setTimeout(() => {
            void verifySessionStillValid()
        }, 1_500)

        const intervalId = window.setInterval(() => {
            void verifySessionStillValid()
        }, POLL_INTERVAL_MS)

        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                void verifySessionStillValid()
            }
        }
        const onFocus = () => {
            void verifySessionStillValid()
        }

        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onFocus)

        return () => {
            subscription.unsubscribe()
            window.clearTimeout(initialTimer)
            window.clearInterval(intervalId)
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onFocus)
        }
    }, [router])

    return null
}
