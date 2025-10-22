import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import Spinner from '../ui/Spinner'
import Modal from '@/components/modals/Modal'
import ReceiptsListTable, { ReceiptListItem } from './documents/ReceiptsListTable'
import BottomPaginationBar from '../ui/BottomPaginationBar'

type ReceiptItem = {
    id: string;
    itemId: string;
    title: string;
    price: number;
    quantity: number;
    measurementType: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
}

type Receipt = {
    id: string;
    placeId: string | null;
    totalPrice: number;
    amountGiven: number;
    change: number;
    paymentOption: 'CASH' | 'CARD' | 'REFUND';
    status: string;
    createdAt?: string;
    timestamp?: string;
    items: ReceiptItem[];
}

type Props = {
    placeId: string
    currency?: string | null
}

export const PlaceReceipts = ({ placeId, currency = 'EUR' }: Props) => {
    const t = useTranslations('Documents')
    const paymentLabels: Record<Receipt['paymentOption'], string> = {
        CASH: t('payments.CASH'),
        CARD: t('payments.CARD'),
        REFUND: t('payments.REFUND'),
    }

    // Helper to format quantity with units
    const formatQuantity = (q: number, type: ReceiptItem['measurementType']) => {
        if (type === 'WEIGHT') {
            return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`
        }
        if (type === 'LENGTH') {
            return q >= 100 ? `${(q / 100).toFixed(2)} m` : `${q} cm`
        }
        if (type === 'VOLUME') {
            return q >= 1000 ? `${(q / 1000).toFixed(2)} l` : `${q} ml`
        }
        if (type === 'AREA') {
            return q >= 10000 ? `${(q / 10000).toFixed(2)} m²` : `${q} cm²`
        }
        return q.toString()
    }

    // Helper to calculate item total with unit conversion
    const calculateItemTotal = (item: ReceiptItem) => {
        const qty = item.quantity
        if (item.measurementType === 'WEIGHT') {
            return item.price * (qty / 1000)
        }
        if (item.measurementType === 'LENGTH') {
            return item.price * (qty / 100)
        }
        if (item.measurementType === 'VOLUME') {
            return item.price * (qty / 1000)
        }
        if (item.measurementType === 'AREA') {
            return item.price * (qty / 10000)
        }
        return item.price * qty
    }

    const [data, setData] = useState<Receipt[]>([])
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<Receipt | null>(null)
    const [reveal, setReveal] = useState(false)
    const [page, setPage] = useState(1)

    const fadeCls = `transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'}`

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        const fetchReceipts = async () => {
            try {
                const params = new URLSearchParams()
                params.set('limit', '25')
                params.set('page', String(page))
                params.set('placeId', placeId)

                const res = await fetch(`/api/receipts?${params.toString()}`)
                if (!res.ok) throw new Error('Failed to load receipts')

                const json: unknown = await res.json()
                if (!cancelled && json && typeof json === 'object' && json !== null) {
                    const obj = json as Record<string, unknown>
                    const rows = Array.isArray(obj.data) ? (obj.data as Receipt[]) : Array.isArray(json) ? (json as Receipt[]) : []
                    const count = typeof obj.total === 'number' ? obj.total : rows.length
                    setData(rows)
                    setTotal(count)
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error'
                if (!cancelled) setError(msg)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchReceipts()
        return () => {
            cancelled = true
        }
    }, [placeId, page])

    // Fade-in reveal after loading completes
    useEffect(() => {
        if (!loading) {
            setReveal(false)
            const tm = window.setTimeout(() => setReveal(true), 50)
            return () => window.clearTimeout(tm)
        }
    }, [loading, data.length])

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 25)), [total])

    return (
        <div>
            <div>
                {loading ? (
                    <div className="py-6">
                        <div className="flex items-center justify-center">
                            <Spinner size={24} className="text-gray-400 dark:text-white/40" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
                ) : data.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 dark:text-gray-400">{t('receipts.empty')}</div>
                ) : (
                    <>
                        <div className="overflow-hidden">
                            <ReceiptsListTable
                                data={data as unknown as ReceiptListItem[]}
                                loading={loading}
                                t={t}
                                fadeCls={fadeCls}
                                setSelected={(r) => setSelected(r as Receipt)}
                                paymentLabels={paymentLabels}
                            />
                        </div>

                        {/* Pagination spacer */}
                        <div aria-hidden className="h-16" />

                        {/* Fixed bottom pagination bar */}
                        <BottomPaginationBar
                            page={page}
                            totalPages={totalPages}
                            onPrev={() => setPage(Math.max(1, page - 1))}
                            onNext={() => setPage(page + 1)}
                            disabled={loading}
                            includeSidebarInset={false}
                            prevLabel={t('pagination.prev')}
                            nextLabel={t('pagination.next')}
                        />
                    </>
                )}
            </div>

            {/* Details Modal */}
            <Modal size="xl" open={!!selected} onClose={() => setSelected(null)}>
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('modal.receipt')}</h2>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('modal.id')}: {selected.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.date')}</div>
                                <div className="text-gray-900 dark:text-white">
                                    <time dateTime={(selected.createdAt ?? selected.timestamp ?? '') as string}>
                                        {new Date(selected.createdAt ?? selected.timestamp ?? '').toLocaleString()}
                                    </time>
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.status')}</div>
                                <div className="text-gray-900 dark:text-white">{selected.status}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.payment')}</div>
                                <div className="text-gray-900 dark:text-white">{paymentLabels[selected.paymentOption]}</div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-md border border-gray-200 dark:border-white/10">
                            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                                <thead className="bg-gray-50 text-gray-900 dark:bg-white/5 dark:text-white">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">{t('modal.item')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.price')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.qty')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                    {selected.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-3 py-2 text-gray-900 dark:text-white">{it.title}</td>
                                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{currency} {it.price.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{formatQuantity(it.quantity, it.measurementType)}</td>
                                            <td className="px-3 py-2 text-right text-gray-900 dark:text-white">{currency} {calculateItemTotal(it).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="">
                            <div className="w-full space-y-1 text-sm">
                                <div className="flex items-center justify-between text-base font-semibold">
                                    <span className="text-gray-900 dark:text-white">{t('modal.total')}</span>
                                    <span className="text-gray-900 dark:text-white">{currency} {selected.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('modal.amountGiven')}</span>
                                    <span className="text-gray-900 dark:text-white">{currency} {selected.amountGiven.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('modal.change')}</span>
                                    <span className="text-gray-900 dark:text-white">{currency} {selected.change.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}
