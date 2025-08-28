'use client'
import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import AddItemsToPlaceModal from '@/components/admin-zone/places/AddItemsToPlaceModal'
import { useParams } from 'next/navigation'

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

type Place = {
    id: string
    teamId: string
    name: string
    description?: string | null
    city?: string | null
    country?: string | null
    currency?: string | null
    totalEarnings: number
    placeTypeId?: string | null
    createdAt: string
    isActive: boolean
    teamPeopleCount: number
}

export default function PlaceDetailPage() {
    const params = useParams<{ placeId: string }>()
    const placeId = params?.placeId
    const [place, setPlace] = useState<Place | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false)
    const [assignedItems, setAssignedItems] = useState<Array<{ id: string; itemId: string; quantity: number; item?: { id: string; name: string; sku?: string | null; price: number } }>>([])
    const [assignedLoading, setAssignedLoading] = useState(true)
    const [assignedError, setAssignedError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!placeId) return
        setLoading(true)
        setError(null)

        // Try to hydrate from localStorage first
        try {
            const cached = localStorage.getItem(`place:${placeId}`)
            if (cached) {
                const parsed = JSON.parse(cached) as Place
                if (!cancelled) {
                    setPlace(parsed)
                    // keep loading true to indicate we are refreshing in background
                }
            }
        } catch {
            // ignore parse errors
        }

        fetch(`/api/places/${placeId}`)
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error'))))
            .then((data: Place) => {
                if (!cancelled) {
                    setPlace(data)
                    // persist to localStorage for next visits
                    try {
                        localStorage.setItem(`place:${placeId}`, JSON.stringify(data))
                    } catch {
                        // ignore storage errors (e.g., quota)
                    }
                }
            })
            .catch((e) => {
                if (!cancelled) setError(typeof e === 'string' ? e : 'Failed to load place')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [placeId])
    console.log(place);

    // Load items assigned to this place
    useEffect(() => {
        if (!placeId) return
        let cancelled = false
        setAssignedLoading(true)
        setAssignedError(null)
        fetch(`/api/places/${placeId}/items`)
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error'))))
            .then((rows: Array<{ id: string; placeId: string; itemId: string; quantity: number; item: { id: string; name: string; sku?: string | null; price: number } }>) => {
                if (!cancelled) setAssignedItems(rows)
            })
            .catch((e) => {
                if (!cancelled) setAssignedError(typeof e === 'string' ? e : 'Failed to load assigned items')
            })
            .finally(() => {
                if (!cancelled) setAssignedLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [placeId])



    const stats = useMemo(() => {
        const currency = place?.currency || 'EUR'
        const total = place?.totalEarnings ?? 0
        // Use a fixed locale to avoid server/client locale differences during hydration
        return [
            { name: 'Total earnings', value: new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total) },
            { name: 'Average ticket', value: '—' },
            { name: 'Items sold', value: '—' },
            { name: 'Active items', value: '—' },
        ]
    }, [place])

    return (
        <AdminLayout>
            <div>
                <header>
                    {/* Heading */}
                    <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:bg-gray-700/10">
                        <div>
                            <div className="flex items-center gap-x-3">
                                <div className="flex-none rounded-full bg-green-500/10 p-1 text-green-500 dark:bg-green-400/10 dark:text-green-400">
                                    <div className="size-2 rounded-full bg-current" />
                                </div>
                                <h1 className="flex gap-x-3 text-base/7">
                                    <span className="font-semibold text-gray-900 dark:text-white">{place?.name || 'Place'}</span>
                                    <span className="text-gray-400 dark:text-gray-600">/</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">#{placeId}</span>
                                </h1>
                            </div>
                            <p className="mt-2 text-xs/6 text-gray-500 dark:text-gray-400">{place?.description || 'Overview and stats'}</p>
                        </div>
                        <div className="order-first flex-none rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-500 ring-1 ring-indigo-200 ring-inset sm:order-0 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30">
                            Production
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 bg-gray-50 sm:grid-cols-2 lg:grid-cols-4 dark:bg-gray-700/10">
                        {stats.map((stat, statIdx) => (
                            <div
                                key={stat.name}
                                className={classNames(
                                    statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                                    'border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5',
                                )}
                            >
                                <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                                <p className="mt-2 flex items-baseline gap-x-2">
                                    <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {stat.value}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                </header>

                {/* Content sections can go here (e.g., recent sales, items list, charts) */}
                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsAddItemsOpen(true)}
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Add items
                        </button>
                    </div>
                    {loading ? (
                        <div className="h-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    ) : error ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="rounded-lg border border-gray-200 dark:border-white/10">
                                <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 dark:border-white/10 dark:text-white">Assigned items</div>
                                <div className="p-4">
                                    {assignedLoading ? (
                                        <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                                    ) : assignedError ? (
                                        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{assignedError}</div>
                                    ) : assignedItems.length === 0 ? (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">No items assigned yet.</div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="text-xs text-gray-500 dark:text-gray-400">
                                                <tr>
                                                    <th className="py-2">Name</th>
                                                    <th className="py-2">SKU</th>
                                                    <th className="py-2 text-right">Price</th>
                                                    <th className="py-2 text-right">Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                {assignedItems.map((row) => (
                                                    <tr key={row.id}>
                                                        <td className="py-2 text-sm text-gray-900 dark:text-white">{row.item?.name ?? `#${row.itemId}`}</td>
                                                        <td className="py-2 text-sm text-gray-500 dark:text-gray-400">{row.item?.sku ?? '—'}</td>
                                                        <td className="py-2 text-right text-sm text-gray-900 dark:text-white">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: place?.currency || 'EUR' }).format(row.item?.price ?? 0)}
                                                        </td>
                                                        <td className="py-2 text-right text-sm text-gray-900 dark:text-white">{row.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
                <AddItemsToPlaceModal
                    placeId={String(placeId)}
                    open={isAddItemsOpen}
                    onClose={() => setIsAddItemsOpen(false)}
                    onAdded={() => {
                        // refresh assigned list
                        if (!placeId) return
                        setAssignedLoading(true)
                        fetch(`/api/places/${placeId}/items`).then((r) => r.json()).then((rows) => setAssignedItems(rows)).finally(() => setAssignedLoading(false))
                    }}
                />
            </div>
        </AdminLayout>
    )
}
