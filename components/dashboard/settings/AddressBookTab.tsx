'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiBook, FiCopy, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi'
import {
    listAddressBook,
    createAddressBookEntry,
    updateAddressBookEntry,
    deleteAddressBookEntry,
    type PublicAddressBookEntry,
} from '../../../app/actions/addressBook'

export default function AddressBookTab() {
    const [entries, setEntries] = useState<PublicAddressBookEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deleteConfirmation, setDeleteConfirmation] = useState<PublicAddressBookEntry | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchEntries = async () => {
        setIsLoading(true)
        setError('')
        try {
            const data = await listAddressBook()
            setEntries(data)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load address book')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries()
        setShowForm(false)
        setEditingId(null)
        setError('')
    }, [])

    const resetForm = () => {
        setName('')
        setAddress('')
        setShowForm(false)
        setEditingId(null)
    }

    const openCreate = () => {
        setEditingId(null)
        setName('')
        setAddress('')
        setError('')
        setShowForm(true)
    }

    const openEdit = (entry: PublicAddressBookEntry) => {
        setEditingId(entry.id)
        setName(entry.name)
        setAddress(entry.address)
        setError('')
        setShowForm(true)
    }

    const handleCopy = (id: string, value: string) => {
        navigator.clipboard.writeText(value)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !address.trim()) return

        setIsSubmitting(true)
        setError('')
        try {
            if (editingId) {
                const result = await updateAddressBookEntry(editingId, {
                    name: name.trim(),
                    address: address.trim(),
                })
                if (result.error) {
                    setError(result.error)
                    return
                }
            } else {
                const result = await createAddressBookEntry(name.trim(), address.trim())
                if (result.error) {
                    setError(result.error)
                    return
                }
            }
            resetForm()
            await fetchEntries()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save entry')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (entry: PublicAddressBookEntry) => {
        setIsDeleting(true)
        setError('')
        try {
            const result = await deleteAddressBookEntry(entry.id)
            if (result.error) {
                setError(result.error)
                return
            }
            if (editingId === entry.id) {
                resetForm()
            }
            setDeleteConfirmation(null)
            await fetchEntries()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete entry')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <div className="min-w-0">
                    <h2 className="text-lg font-medium text-zinc-100">Address Book</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        Private named addresses for chat.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-white/5 shrink-0"
                    >
                        <FiPlus size={14} />
                        <span>Add Address</span>
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl shrink-0">
                    {error}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pt-4 pr-1">
                {showForm ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 max-w-md bg-[#1c1c1f]/40 p-4 border border-white/5 rounded-2xl"
                    >
                        <h3 className="text-sm font-semibold text-zinc-300">
                            {editingId ? 'Edit Address' : 'Add Address'}
                        </h3>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-zinc-500">Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Exchange, Mom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-zinc-500">Address</label>
                            <input
                                type="text"
                                required
                                placeholder="0x..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="bg-[#141416] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-white/20 transition-colors font-mono"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 mt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Save Address'}
                            </button>
                        </div>
                    </form>
                ) : isLoading ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Loading address book...
                    </div>
                ) : entries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-8 text-center">
                        <FiBook size={40} className="mb-3 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-400">No Saved Addresses</p>
                        <p className="text-xs text-zinc-600 mt-1 mb-4">
                            Save public addresses with names to use them in chat.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-3.5 bg-[#1c1c1f]/30 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                            >
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-sm font-semibold text-zinc-200 truncate">
                                        {entry.name}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono truncate">
                                        {entry.address}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => openEdit(entry)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                        title="Edit"
                                    >
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(entry.id, entry.address)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                        title="Copy address"
                                    >
                                        {copiedId === entry.id ? (
                                            <FiCheck size={14} className="text-emerald-400" />
                                        ) : (
                                            <FiCopy size={14} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmation(entry)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {deleteConfirmation && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f1f22] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-zinc-100">Delete Address</h3>
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to delete{' '}
                            <span className="text-zinc-200 font-medium">{deleteConfirmation.name}</span> from
                            your address book? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmation(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteConfirmation)}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
