'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type LoadingOverlayProps = {
    /** When true (and minDuration elapsed), the overlay fades out */
    isReady: boolean
    /** Minimum time (ms) to keep the overlay on screen */
    minDuration?: number
    /** Called after the exit animation completes */
    onFinish?: () => void
    /** Optional number of concentric rings in the animation */
    rings?: number
    /** Deprecated: label text (no longer displayed) */
    label?: string
    /** Deprecated: step texts (no longer displayed) */
    steps?: string[]
    /** Deprecated: step interval (no longer used) */
    stepInterval?: number
}

// Internal Flower of Life canvas animation extracted from provided snippet
const FlowerOfLifeCanvas: React.FC<{ rings?: number }> = ({ rings = 3 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const dprRef = useRef<number>(1)
    const rafRef = useRef<number | null>(null)
    const radiusRef = useRef<number>(0)
    const layersRef = useRef<Array<Array<{ x: number; y: number; angle: number }>>>([])
    const ringsRef = useRef<number>(rings)

    // Keep rings in a ref so effects can read latest
    useEffect(() => {
        ringsRef.current = Math.max(1, Math.min(6, Math.floor(rings)))
        prepareLayers()
        startAnimation()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rings])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctxRef.current = ctx
        dprRef.current = Math.max(1, window.devicePixelRatio || 1)

        const handleResize = () => resize()
        window.addEventListener('resize', handleResize)
        // initial layout
        resize()
        return () => {
            window.removeEventListener('resize', handleResize)
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function resize() {
        const canvas = canvasRef.current!
        const ctx = ctxRef.current!
        const dpr = dprRef.current
        const rect = canvas.getBoundingClientRect()
        const w = Math.max(100, rect.width)
        const h = Math.max(100, rect.height)
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        prepareLayers()
        startAnimation()
    }

    function prepareLayers() {
        const canvas = canvasRef.current
        const dpr = dprRef.current
        if (!canvas) return
        const W = canvas.width / dpr
        const H = canvas.height / dpr
        const ringsVal = ringsRef.current

        const base = Math.min(W, H) / 10
        const radius = Math.max(3, (base * 4) / (3 + ringsVal * 0.8))
        radiusRef.current = radius

        const d = radius
        const h = (Math.sqrt(3) / 2) * d

        const buckets: Array<Array<{ x: number; y: number; angle: number }>> = Array.from(
            { length: ringsVal + 1 },
            () => []
        )

        for (let q = -ringsVal; q <= ringsVal; q++) {
            for (let s = -ringsVal; s <= ringsVal; s++) {
                const t = -q - s
                const dist = (Math.abs(q) + Math.abs(s) + Math.abs(t)) / 2
                if (dist > ringsVal) continue
                const x = (q + s / 2) * d
                const y = s * h
                buckets[dist].push({ x, y, angle: Math.atan2(y, x) })
            }
        }

        layersRef.current = buckets.map((arr) => {
            const copy = (arr || []).slice()
            copy.sort((a, b) => a.angle - b.angle)
            return copy
        })
    }

    function drawBackground() {
        const canvas = canvasRef.current!
        const ctx = ctxRef.current!
        const dpr = dprRef.current
        const W = canvas.width / dpr
        const H = canvas.height / dpr
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.translate(W / 2, H / 2)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H))
        grad.addColorStop(0, 'rgba(200,230,255,0.03)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.fillRect(-W / 2, -H / 2, W, H)
        ctx.restore()
    }

    function drawLayered(progress: number) {
        const canvas = canvasRef.current!
        const ctx = ctxRef.current!
        const dpr = dprRef.current
        const layers = layersRef.current
        const radius = radiusRef.current

        if (!layers || layers.length === 0) {
            drawBackground()
            return
        }

        const W = canvas.width / dpr
        const H = canvas.height / dpr
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.translate(W / 2, H / 2)

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(W, H))
        grad.addColorStop(0, 'rgba(200,230,255,0.03)')
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.fillRect(-W / 2, -H / 2, W, H)

        ctx.lineWidth = Math.max(1, radius * 0.06)
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'
        ctx.globalCompositeOperation = 'lighter'

        const totalLayers = layers.length
        const layerProgress = progress * totalLayers
        let fullLayers = Math.floor(layerProgress)
        if (fullLayers > totalLayers) fullLayers = totalLayers
        const partial = Math.max(0, Math.min(1, layerProgress - fullLayers))

        for (let i = 0; i < fullLayers; i++) {
            const layer = layers[i]
            if (!layer) continue
            for (const p of layer) {
                ctx.beginPath()
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
                ctx.stroke()
            }
        }

        if (fullLayers < totalLayers) {
            const current = layers[fullLayers]
            if (current && current.length > 0) {
                const count = Math.round(partial * current.length)
                for (let j = 0; j < count; j++) {
                    const p = current[j]
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
                    ctx.stroke()
                }
            }
        }

        ctx.restore()
    }

    function startAnimation() {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        const duration = 2200
        const start = performance.now()
        const frame = (now: number) => {
            const progress = Math.min(1, (now - start) / duration)
            drawLayered(progress)
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(frame)
            } else {
                rafRef.current = null
            }
        }
        rafRef.current = requestAnimationFrame(frame)
    }

    return (
        <div className="flower-canvas-wrap">
            <canvas ref={canvasRef} className="flower-canvas" aria-hidden="true" />
        </div>
    )
}

/**
 * Fullscreen loading overlay with a canvas-based animation.
 * It holds for a minimum duration and fades out smoothly once `isReady` is true.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isReady,
    minDuration = 2200,
    onFinish,
    rings,
}) => {
    const [mountedAt] = useState(() => Date.now())
    const [show, setShow] = useState(true)

    // Determine when to hide: both ready and minDuration elapsed
    useEffect(() => {
        if (!show) return
        if (!isReady) return
        const elapsed = Date.now() - mountedAt
        const remaining = Math.max(0, minDuration - elapsed)
        const to = setTimeout(() => setShow(false), remaining)
        return () => clearTimeout(to)
    }, [isReady, minDuration, mountedAt, show])

    return (
        <AnimatePresence onExitComplete={onFinish}>
            {show && (
                <motion.div
                    key="loading-overlay"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[100] grid place-items-center loading-gradient select-none"
                    aria-live="polite"
                    role="status"
                >
                    <FlowerOfLifeCanvas rings={rings} />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default LoadingOverlay
