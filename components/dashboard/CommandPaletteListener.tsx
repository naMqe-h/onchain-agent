'use client'

import { useEffect } from 'react'
import { useCommandPaletteStore } from '../../hooks/useCommandPaletteStore'

export default function CommandPaletteListener() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault()
                useCommandPaletteStore.getState().toggle()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return null
}
