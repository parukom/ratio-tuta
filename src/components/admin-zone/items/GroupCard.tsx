'use client'
import React, { useState } from 'react'
import { formatQuantity } from './format'
import { useTranslations } from 'next-intl'
import type { Group } from './types'

type Props = {
    group: Group
    reveal?: boolean
    onSelect?: () => void
    onAskEditBox?: (groupKey: string) => void
    onAskDeleteBox?: (groupKey: string) => void
}

export function GroupCard({ group, reveal = true, onSelect, onAskEditBox, onAskDeleteBox }: Props) {
    const t = useTranslations('Items')
    const [imgFailed, setImgFailed] = useState(false)
    const currency = group.items[0]?.currency || 'EUR'
    const price = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(group.price)

    const colorStyle: React.CSSProperties | undefined = group.color
        ? { backgroundColor: group.color }
        : undefined

    const fadeCls = `transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'}`

    // Get variant sizes
    const variants = group.items.map((i) => i.size).filter(Boolean)
    const variantsText = variants.length > 0
        ? variants.slice(0, 3).join(', ') + (variants.length > 3 ? '...' : '')
        : null

    return (
        <div
            className={
                'group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5 flex flex-col cursor-pointer'
            }
            onClick={(e) => {
                // Check if click is on button or inside data-no-open
                const target = e.target as HTMLElement
                if (target.closest('button, [data-no-open]')) return
                onSelect?.()
            }}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
        >
            {/* main content fades in as a single block */}
            <div className={`${fadeCls} flex flex-col flex-1`}>
                {/* Image section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
                    {group.imageUrl && !imgFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={group.imageUrl}
                            alt={group.label}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImgFailed(true)}
                        />
                    ) : group.color ? (
                        <div className="h-full w-full" style={colorStyle} />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-xl font-bold text-gray-400 dark:from-white/10 dark:to-white/5 dark:text-gray-500">
                            {group.label.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                    {/* Variants badge */}
                    {group.items.length > 1 && (
                        <span className="absolute top-1 right-1 rounded bg-indigo-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                            {group.items.length} {t('cards.variants')}
                        </span>
                    )}
                </div>

                {/* Info section */}
                <div className="p-2 flex flex-col flex-1">
                    <div className="truncate text-xs font-semibold text-gray-900 dark:text-white" title={group.label}>
                        {group.label}
                    </div>

                    {/* Variants text if available */}
                    {variantsText && (
                        <div className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                            {t('cards.sizes')}: {variantsText}
                        </div>
                    )}

                    {/* Stock and Price row */}
                    <div className="mt-1 flex items-center justify-between gap-1">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            <span className="font-medium text-gray-900 dark:text-white">{formatQuantity(
                                group.totalStock,
                                group.items[0]?.measurementType,
                                group.items[0]?.unit,
                                { pcs: t('units.pcsShort') }
                            )}</span>
                        </div>
                        <div className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">{price}</div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto pt-1.5 flex gap-1" data-no-open onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => onAskEditBox?.(group.key)}
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onAskDeleteBox?.(group.key)}
                            className="flex-1 rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GroupCard
