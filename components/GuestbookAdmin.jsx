'use client'

import { useMemo, useState } from 'react'

function formatTimestamp(timestamp) {
    if (!timestamp) {
        return 'Unknown time'
    }

    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
        return 'Unknown time'
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date)
}

export default function GuestbookAdmin({ entries }) {
    const [items, setItems] = useState(() => Array.isArray(entries) ? entries : [])
    const [feedback, setFeedback] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    const totalEntries = useMemo(() => items.length, [items])

    const handleDelete = async id => {
        const entry = items.find(item => item.id === id)
        const name = entry?.name || 'this doodle'

        const confirmed = window.confirm(`Delete ${name}?`)
        if (!confirmed) {
            return
        }

        setDeletingId(id)
        setFeedback(null)

        try {
            const response = await fetch(`/api/guestbook/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}))
                throw new Error(payload?.error || 'Failed to delete doodle.')
            }

            setItems(current => current.filter(item => item.id !== id))
            setFeedback({ type: 'success', message: 'Doodle removed.' })
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Failed to delete doodle.' })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
            <header className="space-y-3">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Guestbook admin</h1>
                <p className="text-zinc-600 dark:text-zinc-300 max-w-2xl">
                    You are seeing this page because the admin cookie is present. From here you can prune any doodles that slip
                    through the cracks.
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total doodles: {totalEntries}</p>
            </header>

            {feedback && (
                <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                        feedback.type === 'success'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-12 text-center text-zinc-600 dark:text-zinc-300">
                    No doodles to moderate right now.
                </div>
            ) : (
                <ul className="space-y-6">
                    {items.map(entry => (
                        <li
                            key={entry.id}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                        >
                            <div className="relative bg-zinc-100 dark:bg-zinc-800">
                                <img
                                    src={entry.drawing}
                                    alt={`${entry.name}'s doodle`}
                                    className="w-full h-64 object-contain bg-white"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-5 space-y-3">
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{formatTimestamp(entry.createdAt)}</p>
                                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mt-1">{entry.name}</h2>
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(entry.id)}
                                        disabled={deletingId === entry.id}
                                        className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed dark:text-rose-300 dark:border-rose-400/30"
                                    >
                                        {deletingId === entry.id ? 'Deleting…' : 'Delete doodle'}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
