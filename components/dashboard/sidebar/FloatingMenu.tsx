'use client'

import { useState, useRef, useLayoutEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface AnchorRect {
    top: number
    bottom: number
    left: number
    right: number
}

interface FloatingMenuProps {
    anchor: AnchorRect
    width: number
    onClose: () => void
    children: ReactNode
    menuKey?: string | number
}

export default function FloatingMenu({
    anchor,
    width,
    onClose,
    children,
    menuKey,
}: FloatingMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

    useLayoutEffect(() => {
        const el = menuRef.current
        if (!el) return

        const gap = 4
        const pad = 8
        const vh = window.innerHeight
        const vw = window.innerWidth
        const menuH = el.offsetHeight
        const menuW = el.offsetWidth || width

        let left = anchor.right - menuW
        left = Math.max(pad, Math.min(left, vw - menuW - pad))

        const spaceBelow = vh - anchor.bottom - gap - pad
        const spaceAbove = anchor.top - gap - pad
        const preferBelow = menuH <= spaceBelow || spaceBelow >= spaceAbove

        let top: number
        if (preferBelow) {
            top = anchor.bottom + gap
            if (top + menuH > vh - pad) {
                top = Math.max(pad, vh - menuH - pad)
            }
        } else {
            top = anchor.top - gap - menuH
            if (top < pad) top = pad
        }

        setCoords((prev) => {
            if (prev && prev.top === top && prev.left === left) return prev
            return { top, left }
        })
    }, [anchor.top, anchor.bottom, anchor.left, anchor.right, width, menuKey])

    if (typeof document === 'undefined') return null

    return createPortal(
        <>
            <div className="fixed inset-0 z-100" onClick={onClose} aria-hidden />
            <div
                ref={menuRef}
                data-floating-menu
                role="menu"
                className="fixed z-110 max-h-[min(360px,calc(100vh-16px))] overflow-y-auto overscroll-contain bg-[#1f1f22] border border-white/10 rounded-xl shadow-xl py-1"
                style={{
                    width,
                    top: coords?.top ?? 0,
                    left: coords?.left ?? 0,
                    opacity: coords ? 1 : 0,
                    pointerEvents: coords ? 'auto' : 'none',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    )
}
