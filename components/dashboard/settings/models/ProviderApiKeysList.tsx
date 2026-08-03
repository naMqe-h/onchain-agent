import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import type { PublicProviderKeyInfo } from '../../../../app/actions/models/providerKeys'

interface ProviderItem {
    id: string
    label: string
    icon: string
    placeholder: string
}

interface ProviderApiKeysListProps {
    KNOWN_PROVIDERS: ProviderItem[]
    providerKeys: PublicProviderKeyInfo[]
    editingProviderId: string | null
    setEditingProviderId: (id: string | null) => void
    keyInputs: Record<string, string>
    setKeyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
    savingProvider: string | null
    deletingProvider: string | null
    handleSaveKey: (provider: string) => void
    handleDeleteKey: (provider: string) => void
}

export default function ProviderApiKeysList({
    KNOWN_PROVIDERS,
    providerKeys,
    editingProviderId,
    setEditingProviderId,
    keyInputs,
    setKeyInputs,
    savingProvider,
    deletingProvider,
    handleSaveKey,
    handleDeleteKey,
}: ProviderApiKeysListProps) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span>Provider API Keys</span>
                </span>
                <span className="text-[10px] font-normal text-zinc-500">Configure keys to unlock models</span>
            </span>

            <div className="flex flex-col bg-[#141416]/50 rounded-xl border border-white/5 px-3.5 py-1">
                {KNOWN_PROVIDERS.map((prov) => {
                    const existingKey = providerKeys.find((k) => k.provider.toLowerCase() === prov.id)
                    const isSaved = Boolean(existingKey)
                    const isEditing = editingProviderId === prov.id
                    const isSaving = savingProvider === prov.id
                    const isDeleting = deletingProvider === prov.id

                    return (
                        <div
                            key={prov.id}
                            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-3"
                        >
                            <div className="flex items-center gap-2.5 text-sm font-medium text-zinc-200 shrink-0 min-w-36">
                                {prov.icon && (
                                    <img src={`/models/${prov.icon}`} alt="" className="w-4 h-4 object-contain shrink-0" />
                                )}
                                <span className="truncate">{prov.label}</span>
                            </div>

                            {isSaved && !isEditing ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                        {existingKey?.maskedKey}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingProviderId(prov.id)
                                                setKeyInputs((prev) => ({ ...prev, [prov.id]: '' }))
                                            }}
                                            className="p-1.5 text-zinc-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                            title="Edit key"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => handleDeleteKey(prov.id)}
                                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                            title="Delete key"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        handleSaveKey(prov.id)
                                    }}
                                    className="flex items-center gap-2 flex-1 max-w-sm justify-end"
                                >
                                    <input
                                        type="password"
                                        placeholder={prov.placeholder}
                                        value={keyInputs[prov.id] || ''}
                                        onChange={(e) => setKeyInputs({ ...keyInputs, [prov.id]: e.target.value })}
                                        className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSaving || !keyInputs[prov.id]?.trim()}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>

                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingProviderId(null)}
                                            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
                                            title="Cancel"
                                        >
                                            <FiX size={14} />
                                        </button>
                                    )}
                                </form>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
