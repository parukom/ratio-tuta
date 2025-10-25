'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import SearchInput from '@/components/ui/SearchInput'
import { CheckCircle2, List, Package, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatQuantity } from '../items/format'
import { useHelp } from '@/hooks/useHelp'


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
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'
    color?: string | null
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
    const t = useTranslations('Home')
    const tc = useTranslations('Common')
    const ti = useTranslations('Items')
    const { showHelp } = useHelp()
    const VIEW_COOKIE = 'placeAddItemsViewMode'
    const readCookie = (name: string): string | null => {
        try {
            const cookie = typeof document !== 'undefined' ? document.cookie : ''
            const parts = cookie.split('; ').find(row => row.startsWith(name + '='))
            return parts ? decodeURIComponent(parts.split('=')[1]) : null
        } catch { return null }
    }
    const writeCookie = (name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 180) => {
        try {
            if (typeof document === 'undefined') return
            document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`
        } catch { /* noop */ }
    }
    const [items, setItems] = useState<Item[]>([])
    const [assigned, setAssigned] = useState<PlaceItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [inStockOnly, setInStockOnly] = useState(true)
    const [viewMode, setViewMode] = useState<'items' | 'boxes'>('boxes')
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
    const [qtyMap, setQtyMap] = useState<Record<string, string>>({})
    // Unit preference per item: 'small' (cm, g, ml, cm²) or 'large' (m, kg, l, m²)
    const [unitModeMap, setUnitModeMap] = useState<Record<string, 'small' | 'large'>>({})
    // Collapsible boxes state
    const [openGroupsState, setOpenGroupsState] = useState<Record<string, boolean>>({})
    const [addingGroup, setAddingGroup] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!open) return
        let cancelled = false
        // Load persisted view mode from cookie when opening
        try {
            const v = readCookie(VIEW_COOKIE)
            if (v === 'items' || v === 'boxes') setViewMode(v)
        } catch { /* ignore */ }
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
                    name: it.name ?? t('place.items.assignModal.unnamed'),
                    sku: it.sku ?? null,
                    categoryName: it.categoryName ?? null,
                    price: it.price,
                    currency: it.currency ?? 'EUR',
                    isActive: it.isActive,
                    unit: it.unit ?? 'pcs',
                    stockQuantity: typeof it.stockQuantity === 'number' ? it.stockQuantity : 0,
                    measurementType: it.measurementType as Item['measurementType'],
                    color: it.color ?? null,
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
                if (!cancelled) setError(typeof err === 'string' ? err : (err?.error ?? t('place.items.assignModal.errors.load')))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [open, placeId, inStockOnly, t])

    // Persist view mode changes to cookie
    useEffect(() => {
        writeCookie(VIEW_COOKIE, viewMode)
    }, [viewMode])

    // Items that are assigned AND have quantity > 0 should be hidden
    // Items with quantity = 0 should be shown (sold out, can be re-added)
    const assignedIdsWithStock = useMemo(() => {
        return new Set(assigned.filter((pi) => pi.quantity > 0).map((pi) => pi.itemId))
    }, [assigned])

    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase()
        return items
            .filter((it) => !assignedIdsWithStock.has(it.id))
            .filter((it) => (inStockOnly ? (it.stockQuantity ?? 0) > 0 : true))
            .filter((it) =>
                !q
                    ? true
                    : (it.name?.toLowerCase().includes(q) || it.sku?.toLowerCase().includes(q) || it.categoryName?.toLowerCase().includes(q)),
            )
            .slice(0, 100)
    }, [items, assignedIdsWithStock, search, inStockOnly])

    // Group items into boxes by base name and color (assumes "Name - Size" naming)
    type Group = {
        key: string
        label: string
        color: string | null
        items: Item[]
        totalStock: number
    }
    const groups = useMemo(() => {
        const map = new Map<string, Group>()
        for (const it of visibleItems) {
            const name = it.name || ''
            const base = name.split(' - ')[0] || name
            const color = it.color ?? null
            const key = `${base}|${color || ''}`
            const stock = typeof it.stockQuantity === 'number' ? it.stockQuantity : 0
            const existing = map.get(key)
            if (!existing) {
                map.set(key, { key, label: base, color, items: [it], totalStock: stock })
            } else {
                existing.items.push(it)
                existing.totalStock += stock
            }
        }
        // Sort items within group by inferred size/name
        for (const g of map.values()) {
            g.items.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        }
        return Array.from(map.values())
    }, [visibleItems])

    const handleAdd = async (itemId: string, quantityOverride?: number) => {
        try {
            setAddingIds((s) => new Set(s).add(itemId))
            const item = items.find((i) => i.id === itemId)
            const unitMode = unitModeMap[itemId] || 'small'
            let chosen = Number(
                typeof quantityOverride === 'number' ? quantityOverride : Number(qtyMap[itemId] ?? '1'),
            )

            // Convert large units to small units for storage
            if (unitMode === 'large' && item) {
                if (item.measurementType === 'WEIGHT') chosen = Math.floor(chosen * 1000) // kg → g
                else if (item.measurementType === 'LENGTH') chosen = Math.floor(chosen * 100) // m → cm
                else if (item.measurementType === 'VOLUME') chosen = Math.floor(chosen * 1000) // l → ml
                else if (item.measurementType === 'AREA') chosen = Math.floor(chosen * 10000) // m² → cm²
            }

            const quantity = Number.isInteger(chosen) && chosen > 0 ? chosen : 1
            const res = await fetch(`/api/places/${placeId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, quantity }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || tc('errors.failedToAdd'))
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
            alert(err?.message ?? tc('errors.failedToAdd'))
        } finally {
            setAddingIds((s) => {
                const n = new Set(s)
                n.delete(itemId)
                return n
            })
        }
    }

    // Add entire box (group) in one go. Mode 'custom' uses qty inputs; 'all' uses full warehouse stock.
    // Get unit options based on measurement type
    const getUnitOptions = (mt?: Item['measurementType']) => {
        if (mt === 'WEIGHT') return { small: 'g', large: 'kg' }
        if (mt === 'LENGTH') return { small: 'cm', large: 'm' }
        if (mt === 'VOLUME') return { small: 'ml', large: 'l' }
        if (mt === 'AREA') return { small: 'cm²', large: 'm²' }
        return null
    }

    const handleAddBox = async (groupKey: string, itemIds: string[], mode: 'custom' | 'all') => {
        if (addingGroup.has(groupKey)) return
        setAddingGroup((prev) => new Set(prev).add(groupKey))
        let addedCount = 0
        try {
            for (const itemId of itemIds) {
                // Skip items that are already assigned with stock > 0
                if (assignedIdsWithStock.has(itemId)) continue
                const it = items.find((i) => i.id === itemId)
                if (!it) continue
                const stock = Number(it.stockQuantity ?? 0)
                const unitMode = unitModeMap[itemId] || 'small'
                let quantity = mode === 'all' ? stock : Number(qtyMap[itemId] ?? '1')

                // Convert large units to small units for storage
                if (mode !== 'all' && unitMode === 'large') {
                    if (it.measurementType === 'WEIGHT') quantity = Math.floor(quantity * 1000) // kg → g
                    else if (it.measurementType === 'LENGTH') quantity = Math.floor(quantity * 100) // m → cm
                    else if (it.measurementType === 'VOLUME') quantity = Math.floor(quantity * 1000) // l → ml
                    else if (it.measurementType === 'AREA') quantity = Math.floor(quantity * 10000) // m² → cm²
                }

                if (!Number.isFinite(quantity) || quantity <= 0) continue
                if (mode !== 'all') {
                    // clamp to available stock if provided
                    if (stock > 0) quantity = Math.min(quantity, stock)
                }
                const res = await fetch(`/api/places/${placeId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId, quantity }),
                })
                if (!res.ok) {
                    // Try next, but continue to the next item
                    continue
                }
                setAssigned((prev) => [...prev, { id: String(Date.now()) + itemId, placeId, itemId, quantity }])
                addedCount += 1
            }
            if (addedCount > 0) onAdded?.(addedCount)
            if (addedCount === 0) {
                // Optional notice if nothing added
                alert(t('place.items.assignModal.nothingAdded'))
            }
        } finally {
            setAddingGroup((prev) => { const n = new Set(prev); n.delete(groupKey); return n })
        }
    }

    return (
        <Modal size="xl" open={open} onClose={onClose}>
            <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('place.items.assignModal.title')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('place.items.assignModal.subtitle')}</p>

                {showHelp && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
                                <p><strong>{t('place.items.assignModal.help.viewModes.title')}</strong></p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li><Package className="size-3 inline mr-1" />{t('place.items.assignModal.help.viewModes.boxes')}</li>
                                    <li><List className="size-3 inline mr-1" />{t('place.items.assignModal.help.viewModes.items')}</li>
                                </ul>
                                <p className="mt-2"><strong>{t('place.items.assignModal.help.inStock.title')}</strong></p>
                                <p>{t('place.items.assignModal.help.inStock.description')}</p>
                                <p className="mt-2"><strong>{t('place.items.assignModal.help.quantity.title')}</strong></p>
                                <p>{t('place.items.assignModal.help.quantity.description')}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <div className="flex items-center gap-3">
                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('place.items.assignModal.searchPlaceholder')}
                            containerClassName="flex-1"
                            inputClassName="block w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 sm:text-sm/6"
                        />
                        <div className="flex items-center gap-1">
                            {/* In-stock icon toggle */}
                            <button
                                type="button"
                                onClick={() => setInStockOnly((v) => !v)}
                                className={`inline-flex items-center justify-center rounded-md p-2 ring-1 ring-inset transition-colors ${inStockOnly ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20' : 'text-gray-600 ring-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/5'}`}
                                title={inStockOnly ? t('place.items.assignModal.inStockOnTitle') : t('place.items.assignModal.inStockOffTitle')}
                                aria-pressed={inStockOnly}
                            >
                                <CheckCircle2 className="size-4" />
                            </button>
                            {/* View mode: boxes vs items */}
                            <div className="ml-1 inline-flex rounded-md ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('boxes')}
                                    className={`px-2 py-1 text-xs inline-flex items-center gap-1 ${viewMode === 'boxes' ? 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
                                    title={t('place.items.assignModal.view.boxes')}
                                >
                                    <Package className="size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('items')}
                                    className={`px-2 py-1 text-xs inline-flex items-center gap-1 border-l border-gray-200 dark:border-white/10 ${viewMode === 'items' ? 'bg-white text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
                                    title={t('place.items.assignModal.view.items')}
                                >
                                    <List className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 max-h-80 overflow-auto rounded border border-gray-200 dark:border-white/10">
                    {loading ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('place.items.assignModal.loading')}</div>
                    ) : error ? (
                        <div className="p-4 text-sm text-rose-600 dark:text-rose-400">{error}</div>
                    ) : (viewMode === 'items' ? (
                        visibleItems.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('place.items.assignModal.noItems')}</div>
                        ) : (
                            <ul className="divide-y divide-gray-200 dark:divide-white/10">
                                {visibleItems.map((it) => (
                                    <li key={it.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{it.name}</div>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{it.sku || '—'}</span>
                                                {it.categoryName && <span>• {it.categoryName}</span>}
                                                <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
                                                    {t('place.items.assignModal.inWarehouse')}: {formatQuantity(it.stockQuantity ?? 0, it.measurementType, it.unit, { pcs: ti('units.pcsShort') })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={Math.max(1, it.stockQuantity ?? 1)}
                                                    value={qtyMap[it.id] ?? '1'}
                                                    onChange={(e) => setQtyMap((m) => ({ ...m, [it.id]: e.target.value }))}
                                                    className="w-20 rounded-md bg-white px-2 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                                />
                                                {(() => {
                                                    const opts = getUnitOptions(it.measurementType)
                                                    if (!opts) {
                                                        return <span className="text-xs text-gray-600 dark:text-gray-400">{it.unit ?? 'pcs'}</span>
                                                    }
                                                    return (
                                                        <select
                                                            value={unitModeMap[it.id] || 'small'}
                                                            onChange={(e) => setUnitModeMap((m) => ({ ...m, [it.id]: e.target.value as 'small' | 'large' }))}
                                                            className="rounded-md border-0 bg-white py-1.5 px-2 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:ring-white/10"
                                                        >
                                                            <option value="small">{opts.small}</option>
                                                            <option value="large">{opts.large}</option>
                                                        </select>
                                                    )
                                                })()}
                                            </div>
                                            <div className='flex flex-col'>
                                                <button
                                                    onClick={() => handleAdd(it.id, it.stockQuantity ?? 0)}
                                                    disabled={addingIds.has(it.id) || (it.stockQuantity ?? 0) <= 0}
                                                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                                                    title={t('place.items.assignModal.addAllTitle')}
                                                >
                                                    {t('place.items.assignModal.addAll')}
                                                </button>
                                                <button
                                                    onClick={() => handleAdd(it.id)}
                                                    disabled={addingIds.has(it.id)}
                                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                                >
                                                    {addingIds.has(it.id) ? t('place.items.assignModal.adding') : t('place.items.assignModal.add')}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    ) : (
                        // Boxes view
                        groups.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('place.items.assignModal.noBoxes')}</div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-white/10">
                                {groups.map((g) => (
                                    <div key={g.key} className="px-3 py-2">
                                        {/* Group header with collapse toggle */}
                                        <div
                                            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-gray-50 ring-1 ring-inset ring-transparent focus:outline-none focus-visible:ring-gray-300 dark:hover:bg-white/5 dark:focus-visible:ring-white/10"
                                            onClick={() => setOpenGroupsState((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                                            aria-expanded={!!openGroupsState[g.key]}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                {openGroupsState[g.key] ? <ChevronDown className="size-4 text-gray-500 dark:text-gray-400" /> : <ChevronRight className="size-4 text-gray-500 dark:text-gray-400" />}
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                        {g.label} {g.color ? <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">{g.color}</span> : null}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('place.items.assignModal.totalInWarehouse')}: {formatQuantity(
                                                        g.totalStock,
                                                        g.items[0]?.measurementType,
                                                        g.items[0]?.unit,
                                                        { pcs: ti('units.pcsShort') }
                                                    )}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleAddBox(g.key, g.items.map((i) => i.id), 'all') }}
                                                    disabled={addingGroup.has(g.key)}
                                                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                                                    title={t('place.items.assignModal.addBoxAllTitle')}
                                                >
                                                    {t('place.items.assignModal.addAll')}
                                                </button>
                                            </div>
                                        </div>
                                        {openGroupsState[g.key] && (
                                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                {g.items.map((it) => {
                                                    const base = (it.name || '').split(' - ')[0] || it.name
                                                    const size = (it.name || '').startsWith(base + ' - ') ? (it.name || '').slice((base + ' - ').length) : ''
                                                    return (
                                                        <div key={it.id} className="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2 dark:border-white/10">
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{size || it.name}</div>
                                                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span>{it.sku || '—'}</span>
                                                                    <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
                                                                        {t('place.items.assignModal.inWarehouseShort')}: {formatQuantity(
                                                                            it.stockQuantity ?? 0,
                                                                            it.measurementType,
                                                                            it.unit,
                                                                            { pcs: ti('units.pcsShort') }
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        max={Math.max(1, it.stockQuantity ?? 1)}
                                                                        value={qtyMap[it.id] ?? '1'}
                                                                        onChange={(e) => setQtyMap((m) => ({ ...m, [it.id]: e.target.value }))}
                                                                        className="w-16 rounded-md bg-white px-2 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                                                                    />
                                                                    {(() => {
                                                                        const opts = getUnitOptions(it.measurementType)
                                                                        if (!opts) {
                                                                            return <span className="text-xs text-gray-600 dark:text-gray-400">{it.unit ?? 'pcs'}</span>
                                                                        }
                                                                        return (
                                                                            <select
                                                                                value={unitModeMap[it.id] || 'small'}
                                                                                onChange={(e) => setUnitModeMap((m) => ({ ...m, [it.id]: e.target.value as 'small' | 'large' }))}
                                                                                className="rounded-md border-0 bg-white py-1.5 px-1.5 text-xs text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:ring-white/10"
                                                                            >
                                                                                <option value="small">{opts.small}</option>
                                                                                <option value="large">{opts.large}</option>
                                                                            </select>
                                                                        )
                                                                    })()}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAdd(it.id)}
                                                                    disabled={addingIds.has(it.id)}
                                                                    className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                                                >
                                                                    {addingIds.has(it.id) ? t('place.items.assignModal.adding') : t('place.items.assignModal.add')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ))}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-700"
                    >
                        {tc('close')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default AddItemsToPlaceModal
