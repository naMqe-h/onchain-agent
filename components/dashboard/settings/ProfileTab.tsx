'use client'

import { useEffect, useRef, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiCamera, FiLock, FiUser } from 'react-icons/fi'
import {
    changePassword,
    PublicProfile,
    removeAvatar,
    updateDisplayName,
    uploadAvatar,
} from '../../../app/actions/profile/profile'
import { validatePasswordStrength } from '../../../lib/password'

interface ProfileTabProps {
    user: User
    profile: PublicProfile
}

export default function ProfileTab({ user, profile: initialProfile }: ProfileTabProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState(initialProfile)
    const [displayName, setDisplayName] = useState(initialProfile.displayName)
    const [isSavingName, setIsSavingName] = useState(false)
    const [nameMessage, setNameMessage] = useState('')
    const [nameError, setNameError] = useState('')

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarError, setAvatarError] = useState('')
    const [avatarMessage, setAvatarMessage] = useState('')

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordMessage, setPasswordMessage] = useState('')
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        setProfile(initialProfile)
        setDisplayName(initialProfile.displayName)
    }, [initialProfile])

    const initial = (profile.displayName || user.email || 'U').charAt(0).toUpperCase()
    const nameDirty = displayName.trim() !== profile.displayName

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nameDirty || isSavingName) return

        setIsSavingName(true)
        setNameError('')
        setNameMessage('')

        const result = await updateDisplayName(displayName)
        if (result.error || !result.profile) {
            setNameError(result.error || 'Failed to update display name')
        } else {
            setProfile(result.profile)
            setDisplayName(result.profile.displayName)
            setNameMessage('Display name updated')
            router.refresh()
        }

        setIsSavingName(false)
    }

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarError('')
        setAvatarMessage('')

        const maxBytes = 2 * 1024 * 1024
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

        if (!allowedTypes.includes(file.type)) {
            setAvatarError('Only JPEG, PNG, and WebP images are allowed')
            resetFileInput()
            return
        }

        if (file.size > maxBytes) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
            setAvatarError(`Image is too large (${sizeMb} MB). Maximum size is 2 MB.`)
            resetFileInput()
            return
        }

        setIsUploadingAvatar(true)

        try {
            const formData = new FormData()
            formData.append('avatar', file)

            const result = await uploadAvatar(formData)
            if (result.error || !result.profile) {
                setAvatarError(result.error || 'Failed to upload avatar')
            } else {
                setProfile(result.profile)
                setAvatarMessage('Photo updated')
                router.refresh()
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ''
            if (message.toLowerCase().includes('body exceeded') || message.toLowerCase().includes('1 mb')) {
                setAvatarError('Image is too large. Maximum size is 2 MB.')
            } else {
                setAvatarError(message || 'Failed to upload avatar')
            }
        } finally {
            setIsUploadingAvatar(false)
            resetFileInput()
        }
    }

    const handleRemoveAvatar = async () => {
        if (isUploadingAvatar || !profile.avatarUrl) return

        setIsUploadingAvatar(true)
        setAvatarError('')
        setAvatarMessage('')

        const result = await removeAvatar()
        if (result.error || !result.profile) {
            setAvatarError(result.error || 'Failed to remove avatar')
        } else {
            setProfile(result.profile)
            setAvatarMessage('Photo removed')
            router.refresh()
        }

        setIsUploadingAvatar(false)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isChangingPassword) return

        setPasswordError('')
        setPasswordMessage('')

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match')
            return
        }

        const strengthError = validatePasswordStrength(newPassword)
        if (strengthError) {
            setPasswordError(strengthError)
            return
        }

        setIsChangingPassword(true)
        const result = await changePassword(currentPassword, newPassword)

        if (result.error) {
            setPasswordError(result.error)
        } else {
            setPasswordMessage('Password updated successfully')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }

        setIsChangingPassword(false)
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="pb-3 border-b border-white/5 shrink-0">
                <h2 className="text-lg font-medium text-zinc-100">Profile</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                    Manage your photo, display name, and password.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pt-5 flex flex-col gap-6 pr-1">
                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            {profile.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profile.avatarUrl}
                                    alt={profile.displayName}
                                    className="w-16 h-16 rounded-full object-cover border border-white/10 shadow-inner"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-lg font-medium text-white shadow-inner border border-white/10">
                                    {initial}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-zinc-400">
                                <FiCamera size={12} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-0">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={isUploadingAvatar}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploadingAvatar ? 'Uploading…' : 'Change photo'}
                                </button>
                                {profile.avatarUrl && (
                                    <button
                                        type="button"
                                        disabled={isUploadingAvatar}
                                        onClick={handleRemoveAvatar}
                                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-zinc-600">JPEG, PNG or WebP · max 2 MB</p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {avatarError && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl">
                            {avatarError}
                        </div>
                    )}
                    {avatarMessage && !avatarError && (
                        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl">
                            {avatarMessage}
                        </div>
                    )}
                </section>

                <section>
                    <form onSubmit={handleSaveName} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                                <FiUser size={12} />
                                Display name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value)
                                    setNameMessage('')
                                    setNameError('')
                                }}
                                maxLength={50}
                                className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                                placeholder="Your name"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-400">Email</label>
                            <div className="w-full bg-[#1c1c1f]/50 border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={!nameDirty || isSavingName}
                                className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSavingName ? 'Saving…' : 'Save name'}
                            </button>
                        </div>

                        {nameError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl">
                                {nameError}
                            </div>
                        )}
                        {nameMessage && !nameError && (
                            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl">
                                {nameMessage}
                            </div>
                        )}
                    </form>
                </section>

                <div className="h-px bg-white/5" />

                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <FiLock size={14} className="text-zinc-400" />
                        <h3 className="text-sm font-medium text-zinc-200">Change password</h3>
                    </div>

                    <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-400">Current password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value)
                                    setPasswordError('')
                                    setPasswordMessage('')
                                }}
                                autoComplete="current-password"
                                className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-400">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value)
                                    setPasswordError('')
                                    setPasswordMessage('')
                                }}
                                autoComplete="new-password"
                                className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-400">Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    setPasswordError('')
                                    setPasswordMessage('')
                                }}
                                autoComplete="new-password"
                                className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <p className="text-[11px] text-zinc-600">
                            At least 8 characters, with uppercase, lowercase, a number, and a special character.
                        </p>

                        <button
                            type="submit"
                            disabled={
                                isChangingPassword ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword
                            }
                            className="self-start px-4 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-zinc-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isChangingPassword ? 'Updating…' : 'Update password'}
                        </button>

                        {passwordError && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 rounded-xl">
                                {passwordError}
                            </div>
                        )}
                        {passwordMessage && !passwordError && (
                            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl">
                                {passwordMessage}
                            </div>
                        )}
                    </form>
                </section>
            </div>
        </div>
    )
}
