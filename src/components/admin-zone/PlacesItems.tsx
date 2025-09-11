import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import Spinner from '../ui/Spinner'
import { PlusCircle } from 'lucide-react'
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
        measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
    };
}

type Props = {
    placeId: string
    currency?: string | null
    onCountChange?: (count: number) => void
}

export const PlacesItems = ({ placeId, currency = 'EUR', onCountChange }: Props) => {
    const t = useTranslations('Home')
    const tc = useTranslations('Common')

    // local state moved in here
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false)
    const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
    const [assignedLoading, setAssignedLoading] = useState(true)
    const [assignedError, setAssignedError] = useState<string | null>(null)
    const [assignedReveal, setAssignedReveal] = useState(false)

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
        measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
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
            onCountChange?.(rows.length)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setAssignedError(err?.message || 'Failed to load assigned items')
            setAssignedItems([])
            onCountChange?.(0)
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

    async function removeFromShop(itemId: string) {
        const res = await fetch(`/api/places/${placeId}/items`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId })
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data?.error || tc('errors.failedToRemove'))
            return
        }
        setAssignedItems(prev => {
            const next = prev.filter(r => r.itemId !== itemId)
            onCountChange?.(next.length)
            return next
        })
    }

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
    return (
        <div className="rounded-lg border border-gray-200 dark:border-white/10">
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-white/10 p-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {t('place.items.assigned')}
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddItemsOpen(true)}
                    title={t('place.items.addItems')}
                    aria-label={t('place.items.addItems')}
                    className=" md:rounded rounded-full bg-indigo-600 p-1 md:py-0 md:px-2 text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <span className='hidden md:inline-block'>
                        {t('place.items.addItems')}
                    </span>
                    <span className='md:hidden'>
                        <PlusCircle className="h-5 w-5" />
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
                ) : (
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400">
                            <tr className='border-b border-gray-200 dark:border-white/10'>
                                <th className="p-2">{tc('name')}</th>
                                <th className="p-2">SKU</th>
                                <th className="p-2 text-right">{t('place.items.price')}</th>
                                <th className="p-2 text-right">{t('place.items.qty')}</th>
                                <th className="p-2 text-right">{t('place.items.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {assignedItems.map((row) => (
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
                                                const mt = row.item?.measurementType as undefined | 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
                                                if (mt === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`
                                                if (mt === 'LENGTH') return `${q} m (${q * 100} cm)`
                                                if (mt === 'VOLUME') return `${q} l`
                                                if (mt === 'AREA') return `${q} m2`
                                                if (mt === 'TIME') return `${q} h (${q * 60} min)`
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
                        <div><span className="font-medium">{t('place.items.warehouseStock')}:</span> {(() => { const q = Number(info.stockQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return `${q} m (${q * 100} cm)`; if (info.measurementType === 'VOLUME') return `${q} l`; if (info.measurementType === 'AREA') return `${q} m2`; if (info.measurementType === 'TIME') return `${q} h (${q * 60} min)`; return q; })()}</div>
                        <div><span className="font-medium">{t('place.items.assignedHere')}:</span> {(() => { const q = Number(info.placeQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return `${q} m (${q * 100} cm)`; if (info.measurementType === 'VOLUME') return `${q} l`; if (info.measurementType === 'AREA') return `${q} m2`; if (info.measurementType === 'TIME') return `${q} h (${q * 60} min)`; return q; })()}</div>
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
