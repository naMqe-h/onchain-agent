'use server'

import { createClient } from '@/lib/supabase/server'
import { validatePasswordStrength } from '@/lib/password'

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function signupAction(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
        return { error: passwordError }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    if (data.session) {
        return { success: true, loggedIn: true }
    }

    return { success: true }
}
