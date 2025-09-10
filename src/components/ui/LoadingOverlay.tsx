'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type LoadingOverlayProps = {
    /** When true (and minDuration elapsed), the overlay fades out */
    isReady: boolean
    /** Minimum time (ms) to keep the overlay on screen */
    minDuration?: number
    /** Main heading text */
    label?: string
    /** Steps displayed while loading */
    steps?: string[]
    /** Step change interval (ms) */
    stepInterval?: number
    /** Called after the exit animation completes */
    onFinish?: () => void
}

/**
 * Fullscreen loading overlay. It holds for a minimum duration and fades out smoothly once `isReady` is true.
 * Reusable across pages by controlling `isReady` from outside.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isReady,
    minDuration = 2200,
    label = 'Loading...',
    steps = ['Fetching profile', 'Loading events', 'Retrieving recent items'],
    stepInterval = 700,
    onFinish,
}) => {
    const [mountedAt] = useState(() => Date.now())
    const [show, setShow] = useState(true)
    const [idx, setIdx] = useState(0)

    // Rotate through steps while visible
    useEffect(() => {
        if (!show || steps.length === 0) return
        const id = setInterval(() => setIdx((i) => (i + 1) % steps.length), stepInterval)
        return () => clearInterval(id)
    }, [show, stepInterval, steps])

    // Determine when to hide: both ready and minDuration elapsed
    useEffect(() => {
        if (!show) return
        if (!isReady) return
        const elapsed = Date.now() - mountedAt
        const remaining = Math.max(0, minDuration - elapsed)
        const to = setTimeout(() => setShow(false), remaining)
        return () => clearTimeout(to)
    }, [isReady, minDuration, mountedAt, show])

    const currentStep = useMemo(() => (steps.length ? steps[idx] : undefined), [idx, steps])

    return (
        <AnimatePresence onExitComplete={onFinish}>
            {show && (
                <motion.div
                    key="loading-overlay"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
                    aria-live="polite"
                    role="status"
                >
                    <div className="text-center select-none">
                        <div className="text-white text-2xl sm:text-3xl font-semibold tracking-wide">{label}</div>
                        {currentStep ? (
                            <div className="mt-3 text-white/70 text-sm sm:text-base">{currentStep}</div>
                        ) : null}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default LoadingOverlay
