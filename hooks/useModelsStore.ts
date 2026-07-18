import { create } from 'zustand'
import { fetchModelCatalog } from '../app/actions/models/models'
import type { ChatModelOption } from '../lib/models'

interface ModelsStore {
    models: ChatModelOption[]
    status: 'idle' | 'loading' | 'ready' | 'error'
    loadModels: () => Promise<void>
    setModels: (models: ChatModelOption[]) => void
}

export const useModelsStore = create<ModelsStore>((set, get) => ({
    models: [],
    status: 'idle',
    setModels: (models) => set({ models, status: 'ready' }),
    loadModels: async () => {
        const { status } = get()
        if (status === 'loading' || status === 'ready') return

        set({ status: 'loading' })
        try {
            const models = await fetchModelCatalog()
            set({ models, status: 'ready' })
        } catch (err) {
            console.error('Failed to load model catalog:', err)
            set({ status: 'error' })
        }
    },
}))
