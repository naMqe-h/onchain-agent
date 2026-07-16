'use server'

import { createClient } from '@/lib/supabase/server'
import { validatePasswordStrength } from '@/lib/password'
import { redirect } from 'next/navigation'

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

    redirect('/')
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
        redirect('/')
    }

    return { success: true }
}
