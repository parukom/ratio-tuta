import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import Spinner from '../ui/Spinner'
import { PlusCircle, Search, ArrowUpDown } from 'lucide-react'
import AddItemsToPlaceModal from '@/components/admin-zone/places/AddItemsToPlaceModal'
import Modal from '@/components/modals/Modal'

type AssignedItem = {
    id: string;
    itemId: string;
    quantity: number;
    item?: {
        id: string;
        name: string;
        sku?: string | null;
        price: number;
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
    };
}

type Props = {
    placeId: string
    currency?: string | null
    onCountChange?: (count: number) => void
}

type SortKey = 'name' | 'sku' | 'price' | 'qty'
type SortDirection = 'asc' | 'desc'

export const PlacesItems = ({ placeId, currency = 'EUR', onCountChange }: Props) => {
    const t = useTranslations('Home')
    const tc = useTranslations('Common')

    // local state moved in here
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false)
    const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
    const [assignedLoading, setAssignedLoading] = useState(true)
    const [assignedError, setAssignedError] = useState<string | null>(null)
    const [assignedReveal, setAssignedReveal] = useState(false)

    // Search and sort state
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // item info modal
    const [infoOpen, setInfoOpen] = useState(false)
    const [infoLoading, setInfoLoading] = useState(false)
    const [info, setInfo] = useState<null | {
        id: string;
        teamId: string;
        name: string;
        sku: string | null;
        categoryId: string | null;
        price: number;
        taxRateBps: number;
        isActive: boolean;
    unit: string;
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
        stockQuantity: number;
        createdAt: string;
        updatedAt: string;
        placeQuantity: number;
    }>(null)

    const refreshAssigned = async () => {
        setAssignedLoading(true)
        setAssignedError(null)
        try {
            const r = await fetch(`/api/places/${placeId}/items`)
            if (!r.ok) {
                const d = await r.json().catch(() => ({}))
                throw new Error(d?.error || 'Error')
            }
            const rows = await r.json()
            setAssignedItems(rows)
            // notify parent in a separate effect (avoid setState during render)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setAssignedError(err?.message || 'Failed to load assigned items')
            setAssignedItems([])
            // notify parent in a separate effect (avoid setState during render)
        } finally {
            setAssignedLoading(false)
        }
    }

    useEffect(() => {
        refreshAssigned()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [placeId])

    // Fade-in reveal after loading completes
    useEffect(() => {
        if (!assignedLoading) {
            setAssignedReveal(false)
            const tm = window.setTimeout(() => setAssignedReveal(true), 50)
            return () => window.clearTimeout(tm)
        }
    }, [assignedLoading, assignedItems.length])

    // Notify parent about count changes after commit to avoid updating parent during render
    useEffect(() => {
        onCountChange?.(assignedItems.length)
    }, [assignedItems.length, onCountChange])

    async function removeFromShop(itemId: string) {
        const res = await fetch(`/api/places/${placeId}/items`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId })
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data?.error || tc('errors.failedToRemove'))
            return
        }
        setAssignedItems(prev => prev.filter(r => r.itemId !== itemId))
    }

    // Notify parent after count has changed and committed
    useEffect(() => {
        onCountChange?.(assignedItems.length)
    }, [assignedItems.length, onCountChange])

    async function openInfo(itemId: string, placeQuantity: number) {
        setInfoOpen(true)
        setInfoLoading(true)
        try {
            const res = await fetch(`/api/items/${itemId}`)
            if (!res.ok) throw new Error(tc('errors.failedToLoad'))
            const data = await res.json()
            setInfo({
                id: data.id,
                teamId: data.teamId,
                name: data.name,
                sku: data.sku ?? null,
                categoryId: data.categoryId ?? null,
                price: data.price,
                taxRateBps: data.taxRateBps,
                isActive: data.isActive,
                unit: data.unit,
                measurementType: data.measurementType,
                stockQuantity: data.stockQuantity ?? 0,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                placeQuantity,
            })
        } catch {
            setInfo(null)
        } finally {
            setInfoLoading(false)
        }
    }

    // Toggle sort: if same key, flip direction; if different key, start with asc
    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    // Filtered and sorted items
    const filteredAndSortedItems = useMemo(() => {
        // Filter by search query and quantity > 0
        const filtered = assignedItems.filter(item => {
            // Hide items with 0 quantity (sold out)
            if (item.quantity <= 0) return false

            if (!searchQuery.trim()) return true
            const query = searchQuery.toLowerCase()
            const name = (item.item?.name ?? '').toLowerCase()
            const sku = (item.item?.sku ?? '').toLowerCase()
            return name.includes(query) || sku.includes(query)
        })

        // Sort
        filtered.sort((a, b) => {
            let aVal: string | number = ''
            let bVal: string | number = ''

            switch (sortKey) {
                case 'name':
                    aVal = (a.item?.name ?? '').toLowerCase()
                    bVal = (b.item?.name ?? '').toLowerCase()
                    break
                case 'sku':
                    aVal = (a.item?.sku ?? '').toLowerCase()
                    bVal = (b.item?.sku ?? '').toLowerCase()
                    break
                case 'price':
                    aVal = a.item?.price ?? 0
                    bVal = b.item?.price ?? 0
                    break
                case 'qty':
                    aVal = a.quantity
                    bVal = b.quantity
                    break
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal as string)
                    : (bVal as string).localeCompare(aVal)
            } else {
                return sortDirection === 'asc'
                    ? (aVal as number) - (bVal as number)
                    : (bVal as number) - (aVal as number)
            }
        })

        return filtered
    }, [assignedItems, searchQuery, sortKey, sortDirection])
    return (
        <div className="rounded-lg border border-gray-200 dark:border-white/10">
            <header className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 p-2">
                {/* Search input */}
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={tc('search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                    />
                </div>

                {/* Add items button */}
                <button
                    type="button"
                    onClick={() => setIsAddItemsOpen(true)}
                    title={t('place.items.addItems')}
                    aria-label={t('place.items.addItems')}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <PlusCircle className="h-4 w-4" />
                    <span className='hidden sm:inline-block'>
                        {t('place.items.addItems')}
                    </span>
                </button>
            </header>

            <div className="">
                {assignedLoading ? (
                    <div className="py-6">
                        <div className="flex items-center justify-center">
                            <Spinner size={24} className="text-gray-400 dark:text-white/40" />
                        </div>
                    </div>
                ) : assignedError ? (
                    <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{assignedError}</div>
                ) : assignedItems.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2 dark:text-gray-400">{t('place.items.empty')}</div>
                ) : filteredAndSortedItems.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2 dark:text-gray-400">{tc('noResults')}</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400">
                            <tr className='border-b border-gray-200 dark:border-white/10'>
                                <th className="p-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort('name')}
                                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {tc('name')}
                                        <ArrowUpDown className={`h-3 w-3 ${sortKey === 'name' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    </button>
                                </th>
                                <th className="p-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort('sku')}
                                        className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        SKU
                                        <ArrowUpDown className={`h-3 w-3 ${sortKey === 'sku' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    </button>
                                </th>
                                <th className="p-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort('price')}
                                        className="ml-auto flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {t('place.items.price')}
                                        <ArrowUpDown className={`h-3 w-3 ${sortKey === 'price' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    </button>
                                </th>
                                <th className="p-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort('qty')}
                                        className="ml-auto flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                                    >
                                        {t('place.items.qty')}
                                        <ArrowUpDown className={`h-3 w-3 ${sortKey === 'qty' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                                    </button>
                                </th>
                                <th className="p-2 text-right">{t('place.items.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredAndSortedItems.map((row) => (
                                <tr key={row.id}>
                                    <td className="p-2 text-sm">
                                        <div className={`transition-opacity duration-1000 ${assignedReveal ? 'opacity-100' : 'opacity-0'}`}>
                                            <button
                                                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                                onClick={() => openInfo(row.itemId, row.quantity)}
                                            >
                                                {row.item?.name ?? `#${row.itemId}`}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className={`transition-opacity duration-1000 ${assignedReveal ? 'opacity-100' : 'opacity-0'}`}>{row.item?.sku ?? '—'}</div>
                                    </td>
                                    <td className="p-2 text-right text-sm text-gray-900 dark:text-white">
                                        <div className={`transition-opacity duration-1000 ${assignedReveal ? 'opacity-100' : 'opacity-0'}`}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR' }).format(row.item?.price ?? 0)}
                                        </div>
                                    </td>
                                    <td className="p-2 text-right text-sm text-gray-900 dark:text-white">
                                        <div className={`transition-opacity duration-1000 ${assignedReveal ? 'opacity-100' : 'opacity-0'}`}>
                                            {(() => {
                                                const q = Number(row.quantity || 0)
                                                const mt = row.item?.measurementType as undefined | 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'
                                                if (mt === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`
                                                if (mt === 'LENGTH') return q >= 100 ? `${(q / 100).toFixed(2)} m` : `${q} cm`
                                                if (mt === 'VOLUME') return q >= 1000 ? `${(q / 1000).toFixed(2)} l` : `${q} ml`
                                                if (mt === 'AREA') return q >= 10000 ? `${(q / 10000).toFixed(2)} m²` : `${q} cm²`
                                                return `${q} pcs`
                                            })()}
                                        </div>
                                    </td>
                                    <td className="p-2 text-right text-sm">
                                        <div className={`transition-opacity duration-1000 ${assignedReveal ? 'opacity-100' : 'opacity-0'}`}>
                                            <button onClick={() => removeFromShop(row.itemId)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add items modal */}
            <AddItemsToPlaceModal
                placeId={placeId}
                open={isAddItemsOpen}
                onClose={() => setIsAddItemsOpen(false)}
                onAdded={() => refreshAssigned()}
            />

            {/* Item info modal */}
            <Modal open={infoOpen} onClose={() => setInfoOpen(false)} size="md">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('place.items.infoTitle')}</h3>
                {infoLoading ? (
                    <div className="mt-3 h-16 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                ) : info ? (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div><span className="font-medium">{tc('name')}:</span> {info.name}</div>
                        <div><span className="font-medium">{t('place.items.itemId')}:</span> {info.id}</div>
                        <div><span className="font-medium">{t('place.items.teamId')}:</span> {info.teamId}</div>
                        <div><span className="font-medium">SKU:</span> {info.sku || '—'}</div>
                        <div><span className="font-medium">{t('place.items.categoryId')}:</span> {info.categoryId || '—'}</div>
                        <div><span className="font-medium">{t('place.items.unit')}:</span> {info.unit || (info.measurementType === 'WEIGHT' ? 'kg (saved as g)' : 'pcs')}</div>
                        <div><span className="font-medium">{t('place.items.price')}:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR' }).format(info.price || 0)}</div>
                        <div><span className="font-medium">{t('place.items.tax')}:</span> {(info.taxRateBps / 100).toFixed(2)}%</div>
                        <div><span className="font-medium">{t('place.items.active')}:</span> {info.isActive ? tc('yes') : tc('no')}</div>
                        <div><span className="font-medium">{t('place.items.warehouseStock')}:</span> {(() => { const q = Number(info.stockQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return q >= 100 ? `${(q / 100).toFixed(2)} m` : `${q} cm`; if (info.measurementType === 'VOLUME') return q >= 1000 ? `${(q / 1000).toFixed(2)} l` : `${q} ml`; if (info.measurementType === 'AREA') return q >= 10000 ? `${(q / 10000).toFixed(2)} m²` : `${q} cm²`; return q; })()}</div>
                        <div><span className="font-medium">{t('place.items.assignedHere')}:</span> {(() => { const q = Number(info.placeQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return q >= 100 ? `${(q / 100).toFixed(2)} m` : `${q} cm`; if (info.measurementType === 'VOLUME') return q >= 1000 ? `${(q / 1000).toFixed(2)} l` : `${q} ml`; if (info.measurementType === 'AREA') return q >= 10000 ? `${(q / 10000).toFixed(2)} m²` : `${q} cm²`; return q; })()}</div>
                        <div><span className="font-medium">{t('place.items.createdAt')}:</span> {new Date(info.createdAt).toLocaleString()}</div>
                        <div><span className="font-medium">{t('place.items.updatedAt')}:</span> {new Date(info.updatedAt).toLocaleString()}</div>
                    </div>
                ) : (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('place.items.errors.loadDetails')}</div>
                )}
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setInfoOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('close')}</button>
                </div>
            </Modal>
        </div>
    )
}
