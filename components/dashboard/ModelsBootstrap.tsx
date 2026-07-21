'use client'

import { useEffect } from 'react'
import { useModelsStore } from '../../hooks/useModelsStore'
import type { ChatModelOption } from '@/types'

interface ModelsBootstrapProps {
    initialModels?: ChatModelOption[]
}

export default function ModelsBootstrap({ initialModels }: ModelsBootstrapProps) {
    const setModels = useModelsStore((s) => s.setModels)
    const loadModels = useModelsStore((s) => s.loadModels)
    const status = useModelsStore((s) => s.status)

    useEffect(() => {
        if (initialModels && initialModels.length > 0) {
            setModels(initialModels)
            return
        }
        if (status === 'idle') {
            void loadModels()
        }
    }, [initialModels, setModels, loadModels, status])

    return null
}
