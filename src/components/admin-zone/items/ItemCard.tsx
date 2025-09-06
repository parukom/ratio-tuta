'use client'
import React, { useRef, useState } from 'react'
import { ItemRowActions } from './ItemRowActions'
import { useTranslations } from 'next-intl'

type ItemRow = {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    categoryName?: string | null
    price: number
    pricePaid?: number
    taxRateBps: number
    isActive: boolean
    unit?: string
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
    stockQuantity?: number
    createdAt: string
    currency: string
    description?: string | null
    color?: string | null
    size?: string | null
    brand?: string | null
    tags?: string[] | null
    imageUrl?: string | null
}

export function ItemCard({
    item,
    onUpdate,
    onDelete,
    onSelect,
}: {
    item: ItemRow
    onUpdate: (
        id: string,
        patch: Partial<
            Pick<
                ItemRow,
                | 'name'
                | 'sku'
                | 'price'
                | 'taxRateBps'
                | 'isActive'
                | 'measurementType'
                | 'stockQuantity'
                | 'description'
                | 'color'
                | 'size'
                | 'brand'
                | 'tags'
                | 'categoryId'
            >
        >,
        opts?: { categoryName?: string | null }
    ) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onSelect?: (item: ItemRow) => void
}) {
    const t = useTranslations('Items')
    const [imgFailed, setImgFailed] = useState(false)
    const currency = item.currency || 'EUR'
    const price = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(item.price)
    const taxPct = (item.taxRateBps / 100).toFixed(2)
    const currencyFmt = (v: number) => new Intl.NumberFormat(undefined, {
        style: 'currency', currency, maximumFractionDigits: 2,
    }).format(v)
    const cost = typeof item.pricePaid === 'number' ? currencyFmt(item.pricePaid) : undefined
    const profit = typeof item.pricePaid === 'number' ? currencyFmt(item.price - item.pricePaid) : undefined

    const colorStyle: React.CSSProperties | undefined = item.color
        ? { backgroundColor: item.color }
        : undefined

    const lastDownRef = useRef<EventTarget | null>(null)
    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        lastDownRef.current = e.target
    }
    function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
        if (!onSelect) return
        const down = lastDownRef.current as HTMLElement | null
        if (!down) return
        // ensure the mousedown happened inside this card and not on excluded controls
        const container = e.currentTarget as HTMLElement
        if (!container.contains(down)) return
        if (down.closest('button, a, input, textarea, [data-no-open]')) return
        lastDownRef.current = null
        onSelect(item)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (!onSelect) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(item)
        }
    }

    return (
        <div
            className={
                'group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5'
            }
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : -1}
            onMouseDown={handleMouseDown}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
        >
            {/* status and actions */}
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span
                        className={
                            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ' +
                            (item.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10 dark:bg-white/10 dark:text-gray-300')
                        }
                        title={item.isActive ? t('card.active') : t('card.inactive')}
                    >
                        <span
                            className={
                                'inline-block h-1.5 w-1.5 rounded-full ' +
                                (item.isActive ? 'bg-emerald-500' : 'bg-gray-400')
                            }
                        />
                        {item.isActive ? t('card.active') : t('card.inactive')}
                    </span>
                    {item.categoryName && (
                        <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {item.categoryName}
                        </span>
                    )}
                </div>
                <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition" data-no-open>
                    <ItemRowActions item={item} onUpdate={onUpdate} onDelete={onDelete} />
                </div>
            </div>

            {/* header */}
            <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-inset ring-gray-200 dark:ring-white/10">
                    {item.imageUrl && !imgFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImgFailed(true)}
                        />
                    ) : item.color ? (
                        <div className="h-full w-full" style={colorStyle} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xs text-gray-500 dark:from-white/10 dark:to-white/5 dark:text-gray-400">
                            {item.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    {item.size && (
                        <span className="absolute bottom-0 right-0 m-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow ring-1 ring-gray-200 backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-200 dark:ring-white/10">
                            {item.size}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={item.name}>
                        {item.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.sku && <span className="truncate">{t('card.sku')}: {item.sku}</span>}
                        {item.brand && <span className="truncate">• {item.brand}</span>}
                    </div>
                </div>
            </div>

            {/* details */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.price')}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{price}</div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.tax')}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{taxPct}%</div>
                </div>
                {typeof item.pricePaid === 'number' && (
                    <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.cost')}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{cost}</div>
                    </div>
                )}
                {typeof item.pricePaid === 'number' && (
                    <div className="text-right">
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.profit')}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{profit}</div>
                    </div>
                )}
                <div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.unit')}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.unit || 'pcs'}</div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.stock')}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{typeof item.stockQuantity === 'number' ? item.stockQuantity : 0}</div>
                </div>
            </div>

            {/* tags / description */}
            {(item.tags && item.tags.length > 0) || item.description ? (
                <div className="mt-3">
                    {item.tags && item.tags.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 4).map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10"
                                >
                                    {t}
                                </span>
                            ))}
                            {item.tags.length > 4 && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">{t('card.more', { count: item.tags.length - 4 })}</span>
                            )}
                        </div>
                    )}
                    {item.description && (
                        <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
                    )}
                </div>
            ) : null}

            {/* bottom actions (visible on small screens) */}
            <div className="mt-4 flex items-center justify-end gap-2 sm:hidden">
                <ItemRowActions item={item} onUpdate={onUpdate} onDelete={onDelete} />
            </div>
        </div>
    )
}

export default ItemCard
