'use client'

import { useEffect, useRef, useState } from 'react'

const initialForm = { name: '' }

export default function Guestbook() {
    const [entries, setEntries] = useState([])
    const [form, setForm] = useState(initialForm)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const canvasRef = useRef(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasDrawing, setHasDrawing] = useState(false)

    useEffect(() => {
        fetch('/api/guestbook')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEntries(data)
                }
            })
            .catch(() => setError('Failed to load guestbook entries. Please try again later.'))
    }, [])

    const handleChange = event => {
        const { name, value } = event.target
        setForm(current => ({ ...current, [name]: value }))
    }

    const getCanvasContext = () => {
        const canvas = canvasRef.current
        if (!canvas) {
            return null
        }

        const context = canvas.getContext('2d')
        if (!context) {
            return null
        }
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.lineWidth = 4
        context.strokeStyle = '#7c3aed'

        return context
    }

    const getCoordinates = event => {
        const canvas = canvasRef.current
        if (!canvas) {
            return { x: 0, y: 0 }
        }

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        }
    }

    const handlePointerDown = event => {
        event.preventDefault()
        const context = getCanvasContext()
        if (!context) {
            return
        }

        const { x, y } = getCoordinates(event)
        context.beginPath()
        context.moveTo(x, y)
        setIsDrawing(true)
    }

    const handlePointerMove = event => {
        if (!isDrawing) {
            return
        }

        const context = getCanvasContext()
        if (!context) {
            return
        }

        const { x, y } = getCoordinates(event)
        context.lineTo(x, y)
        context.stroke()
        setHasDrawing(true)
    }

    const handlePointerUp = event => {
        if (!isDrawing) {
            return
        }

        const context = getCanvasContext()
        if (!context) {
            return
        }

        const { x, y } = getCoordinates(event)
        context.lineTo(x, y)
        context.stroke()
        context.closePath()
        setIsDrawing(false)
        setHasDrawing(true)
    }

    const handlePointerLeave = () => {
        if (!isDrawing) {
            return
        }

        setIsDrawing(false)
        const context = getCanvasContext()
        context?.closePath()
    }

    const resetCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const context = canvas.getContext('2d')
        context?.clearRect(0, 0, canvas.width, canvas.height)
        setHasDrawing(false)
    }

    const ensureCanvasSize = () => {
        const canvas = canvasRef.current
        if (!canvas) {
            return
        }

        const devicePixelRatio = window.devicePixelRatio || 1
        const width = 640
        const height = 360
        canvas.width = width * devicePixelRatio
        canvas.height = height * devicePixelRatio
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        const context = canvas.getContext('2d')
        if (!context) {
            return
        }

        context.scale(devicePixelRatio, devicePixelRatio)
        context.fillStyle = 'rgba(255,255,255,0)'
        context.fillRect(0, 0, width, height)
    }

    useEffect(() => {
        ensureCanvasSize()
        const canvas = canvasRef.current
        if (!canvas) {
            return undefined
        }

        const preventScroll = event => event.preventDefault()
        canvas.addEventListener('touchstart', preventScroll, { passive: false })

        return () => {
            canvas.removeEventListener('touchstart', preventScroll)
        }
    }, [])

    const handleSubmit = async event => {
        event.preventDefault()
        setError('')
        setSuccess('')

        const trimmedName = form.name.trim()

        if (!trimmedName) {
            setError('Please add your name so I know who doodled!')
            return
        }

        const canvas = canvasRef.current
        if (!canvas) {
            setError('Something went wrong preparing the canvas. Please refresh and try again.')
            return
        }

        const blankCanvas = document.createElement('canvas')
        blankCanvas.width = canvas.width
        blankCanvas.height = canvas.height
        const isBlank = canvas.toDataURL() === blankCanvas.toDataURL()

        if (!hasDrawing || isBlank) {
            setError('Please leave a little doodle before submitting.')
            return
        }

        setIsSubmitting(true)

        try {
            const drawingData = canvas.toDataURL('image/png')
            const response = await fetch('/api/guestbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: trimmedName, drawing: drawingData })
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}))
                throw new Error(payload.error || 'Something went wrong. Please try again.')
            }

            const newEntry = await response.json()
            setEntries(current => [newEntry, ...current])
            setForm(initialForm)
            resetCanvas()
            setSuccess('Thanks for leaving a doodle!')
        } catch (submissionError) {
            setError(submissionError.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">Guestbook</h1>
                <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
                    Leave a doodle to let me know you were here. Your masterpiece will show up below for everyone to enjoy.
                </p>
            </div>

            <div className="bg-white/70 dark:bg-zinc-900/80 backdrop-blur rounded-3xl border border-violet-500/20 shadow-xl p-8 mb-12">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Sign the guestbook</h2>
                <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                    Scribble something fun and add your name so I know who dropped by.
                </p>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="name">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            maxLength={60}
                            className="mt-2 w-full rounded-xl border border-violet-500/30 bg-white/70 dark:bg-zinc-950/70 px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                            placeholder="Your Name"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="canvas">
                            Doodle pad
                        </label>
                        <div className="relative rounded-2xl border border-dashed border-violet-500/40 bg-white/50 dark:bg-zinc-950/70 p-4">
                            <canvas
                                id="canvas"
                                ref={canvasRef}
                                className="block w-full rounded-xl bg-white dark:bg-zinc-900 touch-none"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerLeave}
                                onPointerCancel={handlePointerLeave}
                            />
                            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                                Use your mouse or finger to draw. Tap “Clear” if you want to start over.
                            </p>
                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={resetCanvas}
                                    className="inline-flex items-center justify-center rounded-lg border border-violet-500/30 bg-white/70 dark:bg-transparent px-4 py-2 text-sm font-medium text-violet-600 hover:border-violet-500 hover:text-violet-700 transition"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-emerald-500">{success}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Saving…' : 'Share my doodle'}
                    </button>
                </form>
            </div>

            <div className="bg-white/70 dark:bg-zinc-900/80 backdrop-blur rounded-3xl border border-violet-500/20 shadow-xl p-8">
                <div className="space-y-10">
                    {entries.length === 0 ? (
                        <p className="text-zinc-600 dark:text-zinc-300">No doodles yet. Be the first to sketch something!</p>
                    ) : (
                        entries.map(entry => (
                            <article
                                key={entry.id}
                                className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-violet-500/10 bg-white/70 dark:bg-zinc-950/70 px-6 py-6 shadow-sm transition hover:border-violet-500/40 hover:shadow-lg"
                            >
                                <header className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{entry.name}</h3>
                                        <time className="text-xs text-zinc-500 dark:text-zinc-400" dateTime={entry.createdAt}>
                                            {new Date(entry.createdAt).toLocaleString()}
                                        </time>
                                    </div>
                                </header>
                                {entry.drawing ? (
                                    <div className="overflow-hidden rounded-xl border border-violet-500/20 bg-white">
                                        <img
                                            src={entry.drawing}
                                            alt={`Doodle from ${entry.name}`}
                                            className="w-full h-auto"
                                        />
                                    </div>
                                ) : null}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
