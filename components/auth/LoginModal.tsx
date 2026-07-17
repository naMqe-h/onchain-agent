'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { loginAction, signupAction } from '../../app/actions/auth/auth'
import { useAuthModalStore } from '../../hooks/useAuthModalStore'
import { scaleIn, fadeInOut } from '../../lib/motion'

export default function LoginModal() {
    const isOpen = useAuthModalStore((s) => s.isOpen)
    const close = useAuthModalStore((s) => s.close)
    const router = useRouter()

    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')

    const backdropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            setIsLogin(true)
            setError(null)
            setSuccessMsg(null)
            setPassword('')
            setIsLoading(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, close])

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
            } else {
                setSuccessMsg('Signed in successfully!')
                setTimeout(() => {
                    close()
                    router.refresh()
                }, 600)
            }
        } else {
            const res = await signupAction(formData)
            if (res?.error) {
                setError(res.error)
                setIsLoading(false)
            } else if (res?.loggedIn) {
                setSuccessMsg('Signed in successfully!')
                setTimeout(() => {
                    close()
                    router.refresh()
                }, 600)
            } else {
                setSuccessMsg('Account created! Please sign in.')
                setIsLogin(true)
                setPassword('')
                setIsLoading(false)
            }
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    variants={fadeInOut}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === backdropRef.current) close()
                    }}
                >
                    <motion.div
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-md rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 pt-6 pb-0">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                                    {isLogin ? 'Welcome back' : 'Create an account'}
                                </h2>
                                <p className="mt-1 text-sm text-zinc-500">
                                    {isLogin
                                        ? 'Sign in to start chatting with the agent'
                                        : 'Create an account to get started'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={close}
                                className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-email">
                                        Email
                                    </label>
                                    <input
                                        id="modal-email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        className="block w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="modal-password">
                                        Password
                                    </label>
                                    <input
                                        id="modal-password"
                                        name="password"
                                        type="password"
                                        required
                                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                                        placeholder="••••••••"
                                    />
                                    {!isLogin && (
                                        <div className="mt-2 text-xs space-y-1.5">
                                            <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : 'text-zinc-600'}`}>
                                                {password.length >= 8 ? <FaCheckCircle /> : <FaRegCircle />} Min. 8 characters
                                            </div>
                                            <div className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>
                                                {/[^A-Za-z0-9]/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 special character
                                            </div>
                                            <div className={`flex items-center gap-2 ${/\d/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>
                                                {/\d/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 digit
                                            </div>
                                            <div className={`flex items-center gap-2 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-500' : 'text-zinc-600'}`}>
                                                {/[a-z]/.test(password) && /[A-Z]/.test(password) ? <FaCheckCircle /> : <FaRegCircle />} Min. 1 uppercase & lowercase letter
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-400">
                                    {error}
                                </div>
                            )}

                            {successMsg && (
                                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-3 py-2.5 text-xs text-green-400">
                                    {successMsg}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Processing…' : isLogin ? 'Sign in' : 'Sign up'}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(!isLogin)
                                        setError(null)
                                        setSuccessMsg(null)
                                        setPassword('')
                                    }}
                                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                >
                                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
