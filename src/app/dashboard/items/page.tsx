"use client"
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import CreateItemButton from '@/components/admin-zone/items/CreateItemButton'
import CreateBoxButton from '@/components/admin-zone/items/CreateBoxButton'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { useSearchParams, useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Modal from '@/components/modals/Modal'
import Dropdown from '@/components/ui/Dropdown'

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

const ItemsInner = () => {
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

function ItemRowActions({ item, onUpdate, onDelete }: {
    item: ItemRow;
    onUpdate: (
        id: string,
        patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'brand' | 'tags' | 'categoryId'>>,
        opts?: { categoryName?: string | null }
    ) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const [name, setName] = useState(item.name)
    const [sku, setSku] = useState(item.sku ?? '')
    const [price, setPrice] = useState(String(item.price))
    const [taxRateBps, setTaxRateBps] = useState(String(item.taxRateBps))
    const [isActive, setIsActive] = useState(!!item.isActive)
    // derive initial measurement type (prefer field, fallback from unit)
    const mapUnitToMT = (u?: string): ItemRow['measurementType'] => {
        const m = (u || '').toLowerCase();
        if (['pcs', 'piece', 'pieces', 'unit', 'units'].includes(m)) return 'PCS'
        if (['kg', 'g', 'gram', 'grams', 'kilo'].includes(m)) return 'WEIGHT'
        if (['m', 'cm', 'mm', 'meter', 'metres'].includes(m)) return 'LENGTH'
        if (['l', 'ml', 'litre', 'liters'].includes(m)) return 'VOLUME'
        if (['m2', 'sqm', 'sq'].includes(m)) return 'AREA'
        if (['h', 'hr', 'hour', 'hours', 'min', 'minute', 's', 'sec', 'second'].includes(m)) return 'TIME'
        return 'PCS'
    }
    const [measurementType, setMeasurementType] = useState<ItemRow['measurementType']>(item.measurementType ?? mapUnitToMT(item.unit ?? 'pcs'))
    const [stockQuantity, setStockQuantity] = useState(String(item.stockQuantity ?? 0))
    const [description, setDescription] = useState(item.description ?? '')
    const [color, setColor] = useState(item.color ?? '')
    const [brand, setBrand] = useState(item.brand ?? '')
    const [tagsCSV, setTagsCSV] = useState((item.tags ?? []).join(', '))
    // categories state
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState<string | ''>(item.categoryId ?? '')
    const [creatingCat, setCreatingCat] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [catLoading, setCatLoading] = useState(false)
    const [catMsg, setCatMsg] = useState('')

    async function loadCategories() {
        try {
            const qs = new URLSearchParams()
            // Items page fetch is already scoped to user; teamId optional here
            qs.set('onlyActive', 'true')
            const r = await fetch(`/api/item-categories?${qs.toString()}`)
            if (!r.ok) return setCategories([])
            const data = (await r.json()) as Array<{ id: string; name: string }>
            setCategories(Array.isArray(data) ? data.map(c => ({ id: String(c.id), name: String(c.name) })) : [])
        } catch { setCategories([]) }
    }
    // load when opening
    useEffect(() => { if (open) loadCategories() }, [open])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const nextCategoryId: string | null = categoryId ? categoryId : null
            const nextCategoryName: string | null = nextCategoryId ? (categories.find(c => c.id === nextCategoryId)?.name ?? null) : null
            await onUpdate(item.id, {
                name: name.trim(),
                sku: sku.trim() || null,
                price: Number(price),
                taxRateBps: Number(taxRateBps) || 0,
                isActive,
                measurementType: (measurementType ?? 'PCS'),
                stockQuantity: Number(stockQuantity) || 0,
                description: description.trim() || null,
                color: color.trim() || null,
                brand: brand.trim() || null,
                tags: tagsCSV.split(',').map(t => t.trim()).filter(Boolean),
                categoryId: nextCategoryId,
            }, { categoryName: nextCategoryName })
            setMessage('Saved')
            setOpen(false)
        } catch {
            setMessage('Failed to save')
            toast.error('Failed to save')
        } finally {
            setLoading(false)
        }
    }

    async function confirmDelete() {
        setLoading(true)
        try {
            await onDelete(item.id)
            setOpen(false)
        } catch {
            setMessage('Failed to delete')
            toast.error('Failed to delete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(true)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Edit</button>
            <button onClick={() => confirmDelete()} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10">Delete</button>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit item</h3>
                <form onSubmit={submit} className="mt-4 space-y-3">
                    <Input id={`name-${item.id}`} name="name" type="text" className="" placeholder="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                    <Input id={`sku-${item.id}`} name="sku" type="text" className="" placeholder="SKU (optional)" value={sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)} />
                    {/* Category selector with inline create */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <div className="inline-block">
                            <Dropdown
                                align="left"
                                buttonLabel={([
                                    { key: 'NONE', label: 'No category' },
                                    ...categories.map(c => ({ key: c.id, label: c.name }))
                                ] as Array<{ key: string; label: string }>).find(o => o.key === (categoryId || 'NONE'))?.label || 'No category'}
                                items={[{ key: '', label: 'No category' }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                onSelect={(key) => setCategoryId(key)}
                            />
                        </div>
                        {!creatingCat ? (
                            <div className="mt-2">
                                <button type="button" onClick={() => { setCreatingCat(true); setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ Create new category</button>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2">
                                <Input id={`newCategory-${item.id}`} name="newCategory" type="text" className="" placeholder="New category name" value={newCatName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)} />
                                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!newCatName.trim()) { setCatMsg('Enter a name'); return }
                                        setCatLoading(true); setCatMsg('')
                                        try {
                                            const r = await fetch('/api/item-categories', {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() })
                                            })
                                            const data = await r.json()
                                            if (!r.ok) { setCatMsg(data.error || 'Failed'); return }
                                            setCategories(prev => { const next = [...prev, { id: data.id, name: data.name }]; next.sort((a, b) => a.name.localeCompare(b.name)); return next })
                                            setCategoryId(data.id)
                                            setCreatingCat(false)
                                            setNewCatName('')
                                        } catch { setCatMsg('Network error') } finally { setCatLoading(false) }
                                    }}
                                    disabled={catLoading}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                >
                                    {catLoading ? 'Saving…' : 'Create'}
                                </button>
                            </div>
                        )}
                        {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id={`price-${item.id}`} name="price" type="number" className="" placeholder="Price" value={price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)} />
                        <Input id={`tax-${item.id}`} name="tax" type="number" className="" placeholder="Tax (bps)" value={taxRateBps} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRateBps(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement type</label>
                            <div className="inline-block">
                                <Dropdown
                                    align="left"
                                    buttonLabel={([
                                        { key: 'PCS', label: 'Pieces' },
                                        { key: 'WEIGHT', label: 'Weight' },
                                        { key: 'LENGTH', label: 'Length' },
                                        { key: 'VOLUME', label: 'Volume' },
                                        { key: 'AREA', label: 'Area' },
                                        { key: 'TIME', label: 'Time' },
                                    ] as Array<{ key: ItemRow['measurementType']; label: string }>).find(o => o.key === measurementType)?.label || 'Select'}
                                    items={[
                                        { key: 'PCS', label: 'Pieces' },
                                        { key: 'WEIGHT', label: 'Weight' },
                                        { key: 'LENGTH', label: 'Length' },
                                        { key: 'VOLUME', label: 'Volume' },
                                        { key: 'AREA', label: 'Area' },
                                        { key: 'TIME', label: 'Time' },
                                    ]}
                                    onSelect={(key) => setMeasurementType(key as ItemRow['measurementType'])}
                                />
                            </div>
                        </div>
                        <Input
                            id={`stock-${item.id}`}
                            name="stock"
                            type="number"
                            className=""
                            placeholder={
                                measurementType === 'PCS' ? 'Stock (pcs)'
                                    : measurementType === 'WEIGHT' ? 'Stock (kg)'
                                        : measurementType === 'LENGTH' ? 'Stock (m)'
                                            : measurementType === 'VOLUME' ? 'Stock (l)'
                                                : measurementType === 'AREA' ? 'Stock (m2)'
                                                    : 'Stock (h)'
                            }
                            value={stockQuantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockQuantity(e.target.value)}
                        />
                    </div>
                    <Input id={`desc-${item.id}`} name="description" type="text" className="" placeholder="Description (optional)" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id={`color-${item.id}`} name="color" type="text" className="" placeholder="Color (optional)" value={color} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)} />
                        <Input id={`brand-${item.id}`} name="brand" type="text" className="" placeholder="Brand (optional)" value={brand} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)} />
                    </div>
                    <Input id={`tags-${item.id}`} name="tags" type="text" className="" placeholder="Tags (comma-separated)" value={tagsCSV} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsCSV(e.target.value)} />
                    <div className="flex items-center gap-2">
                        <input id={`active-${item.id}`} name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
                        <label htmlFor={`active-${item.id}`} className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Name and SKU must be unique per team.</div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                            <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </div>
    )
}

// Conflict modal at page root
function ConflictModal({ info, onClose }: { info: { id: string; places: { placeId: string; placeName: string; quantity: number }[] } | null; onClose: () => void }) {
    return (
        <Modal open={!!info} onClose={onClose} size="lg">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cannot delete item</h3>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">This item is currently assigned to the following places. To delete it, remove it from these shops first.</p>
            <div className="mt-4 max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-white/10">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">Place</th>
                            <th className="px-3 py-2 text-right font-medium">Quantity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {(info?.places ?? []).map(p => (
                            <tr key={p.placeId}>
                                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{p.placeName}</td>
                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{p.quantity}</td>
                            </tr>
                        ))}
                        {(info?.places?.length ?? 0) === 0 && (
                            <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-600 dark:text-gray-300">No detailed usage available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex justify-end">
                <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Close</button>
            </div>
        </Modal>
    )
}

export default function Items() {
    return (
        <Suspense>
            <ItemsInner />
        </Suspense>
    )
}