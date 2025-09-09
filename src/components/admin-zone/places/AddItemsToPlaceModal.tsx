'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'


type Item = {
    id: string
    name: string
    sku?: string | null
    categoryName?: string | null
    price: number
    currency?: string | null
    isActive: boolean
    unit?: string | null
    stockQuantity?: number
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
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
    const [inStockOnly, setInStockOnly] = useState(true)
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
    const [qtyMap, setQtyMap] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setLoading(true)
        setError(null)
        Promise.all([
            fetch(`/api/items?onlyActive=true${inStockOnly ? '&inStock=1' : ''}`).then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error')))) as Promise<Array<Partial<Item> & { id: string; price: number; isActive: boolean }>>,
            fetch(`/api/places/${placeId}/items`).then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error')))) as Promise<PlaceItem[]>,
        ])
            .then(([allItems, placeItems]) => {
                if (cancelled) return
                const mapped: Item[] = allItems.map((it) => ({
                    id: it.id,
                    name: it.name ?? 'Unnamed item',
                    sku: it.sku ?? null,
                    categoryName: it.categoryName ?? null,
                    price: it.price,
                    currency: it.currency ?? 'EUR',
                    isActive: it.isActive,
                    unit: it.unit ?? 'pcs',
                    stockQuantity: typeof it.stockQuantity === 'number' ? it.stockQuantity : 0,
                    measurementType: it.measurementType as Item['measurementType'],
                }))
                setItems(mapped)
                setAssigned(placeItems)
                // initialize default quantity to 1 for each unassigned item
                const initial: Record<string, string> = {}
                for (const it of mapped) initial[it.id] = '1'
                setQtyMap(initial)
            })
            .catch((e) => {
                const err = e as { error?: string } | string;
                if (!cancelled) setError(typeof err === 'string' ? err : (err?.error ?? 'Failed to load items'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, placeId, inStockOnly])

    const assignedIds = useMemo(() => new Set(assigned.map((pi) => pi.itemId)), [assigned])

    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase()
        return items
            .filter((it) => !assignedIds.has(it.id))
            .filter((it) => (inStockOnly ? (it.stockQuantity ?? 0) > 0 : true))
            .filter((it) =>
                !q
                    ? true
                    : (it.name?.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q) || it.categoryName?.toLowerCase().includes(q)),
            )
            .slice(0, 100)
    }, [items, assignedIds, search, inStockOnly])

    const handleAdd = async (itemId: string, quantityOverride?: number) => {
        try {
            setAddingIds((s) => new Set(s).add(itemId))
            const chosen = Number(
                typeof quantityOverride === 'number' ? quantityOverride : Number(qtyMap[itemId] ?? '1'),
            )
            const quantity = Number.isInteger(chosen) && chosen > 0 ? chosen : 1
            const res = await fetch(`/api/places/${placeId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, quantity }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || 'Failed to add')
            }
            // reflect locally
            setAssigned((prev) => [
                ...prev,
                { id: String(Date.now()), placeId, itemId, quantity },
            ])
            onAdded?.(1)
        } catch (e: unknown) {
            const err = e as { message?: string };
            console.error(err)
            alert(err?.message ?? 'Failed to add')
        } finally {
            setAddingIds((s) => {
                const n = new Set(s)
                n.delete(itemId)
                return n
            })
        }
    }

    return (
        <Modal size="xl" open={open} onClose={onClose}>
            <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add items to place</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select items to assign to this place.</p>

                <div className="mt-4">
                    <div className="flex items-center gap-3">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, SKU, or category"
                            className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="size-4" />
                            In stock only
                        </label>
                    </div>
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
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{it.name}</div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{it.sku || '—'}</span>
                                            {it.categoryName && <span>• {it.categoryName}</span>}
                                            <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg:white/5 dark:text-gray-300 dark:ring-white/10">
                                                In warehouse: {(() => { const q = Number(it.stockQuantity ?? 0); if (it.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (it.measurementType === 'LENGTH') return `${q} m (${q * 100} cm)`; if (it.measurementType === 'VOLUME') return `${q} l`; if (it.measurementType === 'AREA') return `${q} m2`; if (it.measurementType === 'TIME') return `${q} h (${q * 60} min)`; return `${q} ${it.unit ?? 'pcs'}`; })()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={Math.max(1, it.stockQuantity ?? 1)}
                                                value={qtyMap[it.id] ?? '1'}
                                                onChange={(e) => setQtyMap((m) => ({ ...m, [it.id]: e.target.value }))}
                                                className="w-24 rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                            />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{it.measurementType === 'WEIGHT' ? 'g' : (it.unit ?? 'pcs')}</span>
                                        </div>
                                        <div className='flex flex-col'>
                                            <button
                                                onClick={() => handleAdd(it.id, it.stockQuantity ?? 0)}
                                                disabled={addingIds.has(it.id) || (it.stockQuantity ?? 0) <= 0}
                                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                                                title="Add all units from warehouse"
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => handleAdd(it.id)}
                                                disabled={addingIds.has(it.id)}
                                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                            >
                                                {addingIds.has(it.id) ? 'Adding…' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
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
