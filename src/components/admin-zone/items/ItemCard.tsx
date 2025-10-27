'use client'
import React, { useRef, useState } from 'react'
import { formatQuantity } from './format'
import { useTranslations } from 'next-intl'
import { ItemRowActions } from './ItemRowActions'

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
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'
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
    reveal = true,
    onItemUpdated,
    onItemDeleted,
    onConflict,
    onSelect,
}: {
    item: ItemRow
    reveal?: boolean
    onItemUpdated?: (updated: ItemRow) => void
    onItemDeleted?: (id: string) => void
    onConflict?: (info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' }) => void
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
    // const taxPct = (item.taxRateBps / 100).toFixed(2)
    // const currencyFmt = (v: number) => new Intl.NumberFormat(undefined, {
    //     style: 'currency', currency, maximumFractionDigits: 2,
    // }).format(v)
    // const cost = typeof item.pricePaid === 'number' ? currencyFmt(item.pricePaid) : undefined
    // const profit = typeof item.pricePaid === 'number' ? currencyFmt(item.price - item.pricePaid) : undefined

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
        // Ignore if user is typing in an input/textarea/select or contentEditable element
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
            return
        }
        // Only trigger if the card itself is focused (not bubbling from a child)
        if (e.currentTarget !== e.target) {
            return
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(item)
        }
    }

    const fadeCls = `transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'}`

    return (
        <div
            className={
                'group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5 flex flex-col cursor-pointer'
            }
            onClick={handleCardClick}
            onMouseDown={handleMouseDown}
            onKeyDown={handleKeyDown}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
        >
            {/* main content fades in as a single block */}
            <div className={`${fadeCls} flex flex-col flex-1`}>
                {/* Image section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
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
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xl font-bold text-gray-400 dark:from-white/10 dark:to-white/5 dark:text-gray-500">
                            {item.name.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    {/* Size badge if present */}
                    {item.size && (
                        <span className="absolute bottom-1 right-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm dark:bg-gray-900/90 dark:text-gray-200 dark:ring-white/10">
                            {item.size}
                        </span>
                    )}
                </div>

                {/* Info section */}
                <div className="p-2 flex flex-col flex-1">
                    <div className="truncate text-xs font-semibold text-gray-900 dark:text-white" title={item.name}>
                        {item.name}
                    </div>

                    {/* Stock and Price row */}
                    <div className="mt-1 flex items-center justify-between gap-1">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            <span className="font-medium text-gray-900 dark:text-white">{item.isUnlimited ? '∞' : formatQuantity(
                                item.stockQuantity ?? 0,
                                item.measurementType,
                                item.unit,
                                { pcs: t('units.pcsShort') }
                            )}</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{price}</div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto pt-1.5" data-no-open onClick={(e) => e.stopPropagation()}>
                        <ItemRowActions item={item} onItemUpdated={onItemUpdated} onItemDeleted={onItemDeleted} onConflict={onConflict} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ItemCard
