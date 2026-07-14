'use client'

import { useState } from 'react'
import { loginAction, signupAction } from '../actions/auth/auth'
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMsg(null)

        const formData = new FormData(e.currentTarget)

        if (isLogin) {
            const res = await loginAction(formData)
            if (res?.error) {
                setError(res.error)
                setIsLoading(false)
            }
        } else {
            const res = await signupAction(formData)
            if (res?.error) {
                setError(res.error)
                setIsLoading(false)
            } else if (res?.success) {
                setSuccessMsg('Account created!')
                setIsLogin(true)
                setPassword('')
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-neutral-900/50 p-8 shadow-2xl backdrop-blur-sm border border-neutral-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-400">
                        {isLogin ? 'Enter your details to sign in' : 'Start your journey with us'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full rounded-xl border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-xl border border-neutral-700 bg-neutral-800/50 px-4 py-3 text-white placeholder-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 transition-colors"
                                placeholder="••••••••"
                            />
                            {!isLogin && (
                                <div className="mt-2 text-xs space-y-2">
                                    <div className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-500" : "text-neutral-500"}`}>
                                        {password.length >= 8 ? <FaCheckCircle /> : <FaRegCircle />} Min. 8 characters
                                    </div>
                                    <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? "text-green-500" : "text-neutral-500"}`}>
                                        {/[^A-Za-z0-9]/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 special character
                                    </div>
                                    <div className={`flex items-center gap-2 ${/\d/.test(password) ? "text-green-500" : "text-neutral-500"}`}>
                                        {/\d/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 digit
                                    </div>
                                    <div className={`flex items-center gap-2 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-500" : "text-neutral-500"}`}>
                                        {/[a-z]/.test(password) && /[A-Z]/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 uppercase and lowercase letter
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        {isLoading ? 'Processing...' : isLogin ? 'Sign in' : 'Sign up'}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError(null)
                            setSuccessMsg(null)
                            setPassword('')
                        }}
                        className="text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}
