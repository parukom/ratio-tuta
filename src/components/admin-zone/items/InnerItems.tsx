import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import CreateBoxButton from "./CreateBoxButton"
import CreateItemButton from "./CreateItemButton"
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import TableSkeleton from "@/components/ui/TableSkeleton"
import { ItemRowActions } from "./ItemRowActions"
import { ConflictModal } from "./ConflictModal"


type ItemRow = {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    categoryName?: string | null
    price: number
    taxRateBps: number
    isActive: boolean
    unit?: string
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
    stockQuantity?: number
    createdAt: string
    currency: string
    description?: string | null
    color?: string | null
    brand?: string | null
    tags?: string[] | null
}


export const ItemsInner = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const qParam = searchParams.get('q') ?? ''
    const onlyActiveParam = searchParams.get('onlyActive') ?? 'true'

    const [items, setItems] = useState<ItemRow[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState(qParam)
    const [onlyActive, setOnlyActive] = useState(onlyActiveParam === 'true')

    const applyQuery = useCallback((next: { q?: string; onlyActive?: boolean }) => {
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        if (typeof next.q === 'string') {
            if (next.q) params.set('q', next.q); else params.delete('q')
        }
        if (typeof next.onlyActive === 'boolean') {
            params.set('onlyActive', String(next.onlyActive))
        }
        router.push(`?${params.toString()}`)
    }, [router, searchParams])

    // Fetch items
    const fetchItems = useCallback(async () => {
        setLoading(true)
        try {
            const qp = new URLSearchParams()
            if (qParam) qp.set('q', qParam)
            if (onlyActiveParam) qp.set('onlyActive', onlyActiveParam)
            const r = await fetch(`/api/items?${qp.toString()}`)
            if (!r.ok) throw new Error('Failed to fetch')
            const data: ItemRow[] = await r.json()
            setItems(Array.isArray(data) ? data : [])
        } catch {
            setItems([])
            toast.error('Failed to fetch items')
        } finally {
            setLoading(false)
        }
    }, [qParam, onlyActiveParam])

    // Fetch on param changes
    useEffect(() => { fetchItems() }, [fetchItems])

    // When q/onlyActive inputs change, push to URL after small debounce for q
    useEffect(() => {
        const h = setTimeout(() => applyQuery({ q }), 300)
        return () => clearTimeout(h)
    }, [q, applyQuery])
    useEffect(() => { applyQuery({ onlyActive }) }, [onlyActive, applyQuery])

    function onCreated(created: {
        id: string
        teamId: string
        name: string
        sku?: string | null
        categoryId?: string | null
        price: number
        taxRateBps: number
        isActive: boolean
        createdAt: string
    }) {
        // Optimistic add to top (only if visible per current filter)
        if (!onlyActive || created.isActive) {
            const optimistic: ItemRow = {
                id: created.id,
                teamId: created.teamId,
                name: created.name,
                sku: created.sku ?? null,
                categoryId: created.categoryId ?? null,
                categoryName: null,
                price: created.price,
                taxRateBps: created.taxRateBps,
                isActive: created.isActive,
                unit: (created as unknown as { unit?: string }).unit ?? 'pcs',
                stockQuantity: (created as unknown as { stockQuantity?: number }).stockQuantity ?? 0,
                createdAt: created.createdAt,
                currency: 'EUR',
            }
            setItems(prev => [optimistic, ...prev.filter(i => i.id !== optimistic.id)])
        }
        toast.success('Item created')
        // Background refetch to sync
        fetchItems()
    }

    // Edit/Delete helpers
    async function updateItem(
        id: string,
        patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'brand' | 'tags' | 'categoryId'>>,
        opts?: { categoryName?: string | null }
    ) {
        const res = await fetch(`/api/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated: ItemRow = await res.json()
        setItems(prev => prev.map(it => {
            if (it.id !== id) return it
            const next: ItemRow = { ...it, ...updated }
            if (opts && 'categoryName' in (opts || {})) {
                next.categoryName = opts.categoryName ?? null
            }
            return next
        }))
        toast.success('Item updated')
    }

    const [conflictInfo, setConflictInfo] = useState<null | { id: string; places: { placeId: string; placeName: string; quantity: number }[] }>(null)
    async function deleteItem(id: string) {
        const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
        if (res.status === 409) {
            // Fetch where it's used and show guidance
            try {
                const r2 = await fetch(`/api/items/${id}/places`)
                const data = await r2.json()
                setConflictInfo({ id, places: Array.isArray(data) ? data : [] })
            } catch {
                setConflictInfo({ id, places: [] })
            }
            toast('Item is assigned to places', { icon: '⚠️' })
            return
        }
        if (!res.ok) throw new Error('Failed to delete')
        setItems(prev => prev.filter(it => it.id !== id))
        toast.success('Item deleted')
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Items</h1>
                <div className="flex items-center gap-2">
                    <CreateBoxButton onDone={fetchItems} />
                    <CreateItemButton onCreated={onCreated} />
                </div>

            </div>

            <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3 shadow-xs dark:border-white/10 dark:bg-gray-900">
                <div className="relative flex-1">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by name or SKU"
                        className="block w-full rounded-md bg-white pl-8 pr-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
                    Active only
                </label>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                    <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Item</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">SKU</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Category</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Price</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Tax</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Unit</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Stock</th>
                            <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                        </tr>
                    </thead>
                    {loading ? (
                        <TableSkeleton rows={8} columnWidths={["w-56", "w-36", "w-24", "w-24", "w-16", "w-20", "w-20", "w-40", "w-32"]} />
                    ) : items.length === 0 ? (
                        <tbody>
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">
                                    No items found.
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {items.map((it) => (
                                <tr key={it.id} className={!it.isActive ? 'opacity-60' : ''}>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-gray-900 dark:text-white">{it.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">#{it.id}</div>
                                    </td>
                                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.sku || '—'}</td>
                                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.categoryName || '—'}</td>
                                    <td className="px-2 py-2 text-right text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: it.currency || 'EUR' }).format(it.price)}
                                    </td>
                                    <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{(it.taxRateBps / 100).toFixed(2)}%</td>
                                    <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{it.unit || 'pcs'}</td>
                                    <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{typeof it.stockQuantity === 'number' ? it.stockQuantity : '0'}</td>
                                    <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">
                                        <ItemRowActions item={it} onUpdate={updateItem} onDelete={deleteItem} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>
            </div>

            <ConflictModal info={conflictInfo} onClose={() => setConflictInfo(null)} />
        </>
    )
}