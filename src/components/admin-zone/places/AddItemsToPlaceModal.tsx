'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'

type Item = {
    id: string
    name: string
    sku?: string | null
    categoryName?: string | null
    price: number
    currency?: string | null
    isActive: boolean
}

type PlaceItem = {
    id: string
    placeId: string
    itemId: string
    quantity: number
}

type Props = {
    placeId: string
    open: boolean
    onClose: () => void
    onAdded?: (addedCount: number) => void
}

const AddItemsToPlaceModal: React.FC<Props> = ({ placeId, open, onClose, onAdded }) => {
    const [items, setItems] = useState<Item[]>([])
    const [assigned, setAssigned] = useState<PlaceItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setLoading(true)
        setError(null)
        Promise.all([
            fetch('/api/items?onlyActive=true').then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error')))),
            fetch(`/api/places/${placeId}/items`).then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error')))),
        ])
            .then(([allItems, placeItems]: [Item[], PlaceItem[]]) => {
                if (cancelled) return
                const mapped: Item[] = allItems.map((it) => ({
                    id: it.id,
                    name: it.name,
                    sku: it.sku ?? null,
                    categoryName: it.categoryName ?? null,
                    price: it.price,
                    currency: it.currency ?? 'EUR',
                    isActive: it.isActive,
                }))
                setItems(mapped)
                setAssigned(placeItems)
            })
            .catch((e) => {
                if (!cancelled) setError(typeof e === 'string' ? e : 'Failed to load items')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, placeId])

    const assignedIds = useMemo(() => new Set(assigned.map((pi) => pi.itemId)), [assigned])

    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase()
        return items
            .filter((it) => !assignedIds.has(it.id))
            .filter((it) =>
                !q
                    ? true
                    : (it.name?.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q) || it.categoryName?.toLowerCase().includes(q)),
            )
            .slice(0, 100)
    }, [items, assignedIds, search])

    const handleAdd = async (itemId: string) => {
        try {
            setAddingIds((s) => new Set(s).add(itemId))
            const res = await fetch(`/api/places/${placeId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, quantity: 1 }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || 'Failed to add')
            }
            // reflect locally
            setAssigned((prev) => [
                ...prev,
                { id: String(Date.now()), placeId, itemId, quantity: 1 },
            ])
            onAdded?.(1)
        } catch (e) {
            console.error(e)
            alert((e as Error).message)
        } finally {
            setAddingIds((s) => {
                const n = new Set(s)
                n.delete(itemId)
                return n
            })
        }
    }

    return (
        <Modal open={open} onClose={onClose}>
            <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add items to place</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select items to assign to this place.</p>

                <div className="mt-4">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, SKU, or category"
                        className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                </div>

                <div className="mt-4 max-h-80 overflow-auto rounded border border-gray-200 dark:border-white/10">
                    {loading ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
                    ) : error ? (
                        <div className="p-4 text-sm text-rose-600 dark:text-rose-400">{error}</div>
                    ) : visibleItems.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No items found.</div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-white/10">
                            {visibleItems.map((it) => (
                                <li key={it.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{it.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {it.sku || '—'} {it.categoryName ? `• ${it.categoryName}` : ''}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAdd(it.id)}
                                        disabled={addingIds.has(it.id)}
                                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                                    >
                                        {addingIds.has(it.id) ? 'Adding…' : 'Add'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default AddItemsToPlaceModal
