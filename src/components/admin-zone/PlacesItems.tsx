import { useTranslations } from 'next-intl'
import React from 'react'
import Spinner from '../ui/Spinner'
import { Place } from './places/types'
import { PlusCircle } from 'lucide-react'

type Props = {
    setIsAddItemsOpen: (value: React.SetStateAction<boolean>) => void
    assignedLoading: boolean
    assignedError: string | null
    assignedItems: {
        id: string;
        itemId: string;
        quantity: number;
        item?: {
            id: string;
            name: string;
            sku?: string | null | undefined;
            price: number;
            measurementType?: "PCS" | "WEIGHT" | "LENGTH" | "VOLUME" | "AREA" | "TIME" | undefined;
        } | undefined;
    }[]
    assignedReveal?: boolean
    place: Place | null
    openInfo(itemId: string, placeQuantity: number): Promise<void>
    removeFromShop(itemId: string): Promise<void>
}

export const PlacesItems = ({ setIsAddItemsOpen, assignedLoading, assignedError, assignedItems, assignedReveal, place, openInfo, removeFromShop }: Props) => {
    const t = useTranslations('Home')
    const tc = useTranslations('Common')
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
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: place?.currency || 'EUR' }).format(row.item?.price ?? 0)}
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
        </div>
    )
}
