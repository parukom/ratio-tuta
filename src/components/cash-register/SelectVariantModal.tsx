"use client"
import React, { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import { useTranslations } from 'next-intl'

export type VariantChild = {
    placeItemId: string
    itemId: string
    quantity: number // stock left
    price: number
    sku: string | null
    size?: string | null
    unit?: string | null
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
}

export type VariantGroup = {
    key: string
    name: string
    color: string | null
    price: number
    quantity: number
    items: VariantChild[]
}

type Props = {
    open: boolean
    onClose: () => void
    group: VariantGroup | null
    onConfirm: (opts: { child: VariantChild; quantity: number }) => void
    currency?: string
}

const measurementLabel = (mt?: VariantChild['measurementType'], unit?: string | null, units?: Record<string, string>) => {
    switch (mt) {
        case 'WEIGHT':
            return unit?.toLowerCase() === 'kg' ? (units?.kilograms ?? 'Kilograms') : (units?.WEIGHT ?? 'Weight')
        case 'LENGTH':
            return unit || (units?.LENGTH ?? 'Length')
        case 'VOLUME':
            return unit || (units?.VOLUME ?? 'Volume')
        case 'AREA':
            return unit || (units?.AREA ?? 'Area')
        case 'TIME':
            return unit || (units?.TIME ?? 'Time')
        case 'PCS':
        default:
            return unit || (units?.PCS ?? 'Pieces')
    }
}

export default function SelectVariantModal({ open, onClose, group, onConfirm, currency = 'EUR' }: Props) {
    const t = useTranslations('CashRegister')
    const tc = useTranslations('Common')
    type UnitsMap = {
        PCS: string;
        WEIGHT: string;
        LENGTH: string;
        VOLUME: string;
        AREA: string;
        TIME: string;
        kilograms: string;
    }
    const units = t.raw('units') as UnitsMap
    const [selectedId, setSelectedId] = useState<string>('')
    const [qty, setQty] = useState<string>('1')
    const [inStockOnly, setInStockOnly] = useState<boolean>(true)

    // Persist per session
    useEffect(() => {
        try {
            const v = sessionStorage.getItem('cashRegister:variantInStockOnly')
            if (v !== null) setInStockOnly(v === '1' || v === 'true')
        } catch { /* noop */ }
    }, [])
    useEffect(() => {
        try { sessionStorage.setItem('cashRegister:variantInStockOnly', inStockOnly ? '1' : '0') } catch { /* noop */ }
    }, [inStockOnly])

    const variants = useMemo(() => group?.items ?? [], [group])
    const displayVariants = useMemo(() => variants.filter(v => !inStockOnly || v.quantity > 0), [variants, inStockOnly])
    const selected = useMemo(() => displayVariants.find(v => v.itemId === selectedId) ?? displayVariants[0], [displayVariants, selectedId])

    const maxQty = selected ? Math.max(0, selected.quantity) : 0

    const isWeight = selected?.measurementType === 'WEIGHT'
    const isLength = selected?.measurementType === 'LENGTH'
    const formatWeight = (grams: number) => {
        if (!Number.isFinite(grams)) return '0 g'
        if (grams >= 1000) {
            const kg = grams / 1000
            // Trim .0
            const text = (Math.round(kg * 100) / 100).toString()
            return `${text} kg`
        }
        return `${grams} g`
    }
    const qtyNumber = Number(qty)
    const approxKg = isWeight && Number.isFinite(qtyNumber) ? (qtyNumber / 1000) : null
    const approxCm = isLength && Number.isFinite(qtyNumber) ? Math.round(qtyNumber * 100) : null

    // For LENGTH, stock quantity currently comes from API in meters (integer).
    const formatLengthMeters = (m: number) => {
        if (!Number.isFinite(m)) return '0 m'
        return `${m} m`
    }

    return (
        <Modal open={open} onClose={onClose} size="md">
            <div>
                <div className="flex items-center gap-2">
                    {group?.color ? (
                        <span
                            className="inline-block h-4 w-4 rounded ring-1 ring-inset ring-gray-200 dark:ring-white/10"
                            style={{ backgroundColor: group.color || undefined }}
                            aria-label="Color"
                        />
                    ) : null}
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{group?.name || t('selectVariant')}</h3>
                </div>

                <div className="mt-4 space-y-3">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{t('chooseSize')}</div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    className="size-4"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                />
                                {t('inStockOnly')}
                            </label>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {displayVariants.length === 0 ? (
                                <div className="col-span-2 rounded border border-gray-200 p-3 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300">{t('noVariants')}</div>
                            ) : displayVariants.map(v => (
                                <button
                                    key={v.itemId}
                                    onClick={() => setSelectedId(v.itemId)}
                                    className={`rounded-md border px-3 py-2 text-sm text-left ${selected?.itemId === v.itemId ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400' : 'border-gray-300 dark:border-white/10'} bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700`}
                                    data-variant-selected={selected?.itemId === v.itemId ? 'true' : 'false'}
                                >
                                    <div className="min-w-0">
                                        <div className="truncate font-medium text-gray-900 dark:text-white">
                                            {(group?.name || 'Item')}{v.size ? ` - ${v.size}` : ''}
                                        </div>
                                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            {measurementLabel(v.measurementType, v.unit, units)}{v.sku ? ` • SKU: ${v.sku}` : ''}
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                            <span>{t('stock')}: {v.measurementType === 'WEIGHT' ? formatWeight(v.quantity) : (v.measurementType === 'LENGTH' ? formatLengthMeters(v.quantity) : v.quantity)}</span>
                                            <span>{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v.price)}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                            {isWeight
                                ? t('quantityGrams')
                                : isLength
                                    ? t('quantityMeters')
                                    : `${t('quantity')} (${measurementLabel(selected?.measurementType, selected?.unit, units)})`}
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <Input
                                type="number"
                                min={isLength ? 0.01 : (isWeight ? 1 : 1)}
                                step={isLength ? 0.01 : 1}
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                className="w-40"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('max')}: {isWeight ? formatWeight(maxQty) : (isLength ? formatLengthMeters(maxQty) : maxQty)}</span>
                        </div>
                        {isWeight && Number.isFinite(qtyNumber) && qtyNumber > 0 && (
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">≈ {approxKg?.toFixed(2)} kg</div>
                        )}
                        {isLength && Number.isFinite(qtyNumber) && qtyNumber > 0 && (
                            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">≈ {approxCm} cm</div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-gray-700"
                    >
                        {tc('cancel')}
                    </button>
                    <button
                        type="button"
                        disabled={!selected || maxQty <= 0}
                        onClick={() => {
                            const n = Number(qty)
                            const valid = Number.isFinite(n) && n > 0
                            // Keep LENGTH quantity in meters (can be decimal) for cart and pricing
                            const desired = valid ? n : 1
                            const capped = Math.min(desired, maxQty)
                            if (selected) onConfirm({ child: selected, quantity: capped })
                        }}
                        className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {t('addToCart')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
