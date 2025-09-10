"use client"

import React, { useEffect, useState } from 'react'
import { Group, ItemRow } from './types'
import ItemCard from './ItemCard'
import Spinner from '@/components/ui/Spinner'
import { ChevronDown, ChevronRight, Edit3, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Props = {
    items: ItemRow[]
    groups: Group[]
    grouped: boolean
    loading: boolean
    openGroups: Record<string, boolean>
    setOpenGroups: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void
    onItemUpdated: (updated: ItemRow) => void
    onItemDeleted: (id: string) => void
    onConflict?: (info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' }) => void
    onAskDeleteBox: (groupKey: string) => void
    onAskEditBox: (groupKey: string) => void
    onSelectItem?: (item: ItemRow) => void
}

export default function ItemsCardsView({ items, groups, grouped, loading, openGroups, setOpenGroups, onItemUpdated, onItemDeleted, onConflict, onAskDeleteBox, onAskEditBox, onSelectItem }: Props) {
    const t = useTranslations('Items')
    const [reveal, setReveal] = useState(false)
    // track per-box reveal so items inside a box fade in when the box is opened
    const [boxReveal, setBoxReveal] = useState<Record<string, boolean>>({})
    const headerFadeCls = `transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'}`
    useEffect(() => {
        if (!loading) {
            setReveal(false)
            // small timeout to ensure cards mount before fading content
            const tm = setTimeout(() => setReveal(true), 50)
            return () => clearTimeout(tm)
        }
    }, [loading, items.length, groups.length])

    // If any boxes are already open (e.g., persisted state), trigger their reveal after mount
    useEffect(() => {
        if (!grouped) return
        const timers: number[] = []
        for (const g of groups) {
            if (openGroups[g.key] && !boxReveal[g.key]) {
                setBoxReveal((prev) => ({ ...prev, [g.key]: false }))
                const id = window.setTimeout(() => {
                    setBoxReveal((prev) => ({ ...prev, [g.key]: true }))
                }, 50)
                timers.push(id)
            }
        }
        return () => {
            for (const id of timers) clearTimeout(id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grouped, openGroups])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size={24} className="text-gray-400 dark:text-white/40" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="lg:rounded-lg border-y lg:border border-gray-200 p-8 text-center text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">{t('table.noItems')}</div>
        )
    }

    if (!grouped) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((it) => (
                    <ItemCard
                        key={it.id}
                        item={it}
                        reveal={reveal}
                        onItemUpdated={onItemUpdated}
                        onItemDeleted={onItemDeleted}
                        onConflict={onConflict}
                        onSelect={onSelectItem}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {groups.map((g) => (
                <div key={g.key} className="rounded-xl border border-gray-200 dark:border-white/10">
                    <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={!!openGroups[g.key]}
                        onClick={() => {
                            const willOpen = !openGroups[g.key]
                            setOpenGroups((prev) => ({ ...prev, [g.key]: willOpen }))
                            if (willOpen) {
                                setBoxReveal((prev) => ({ ...prev, [g.key]: false }))
                                window.setTimeout(() => {
                                    setBoxReveal((prev) => ({ ...prev, [g.key]: true }))
                                }, 50)
                            } else {
                                // reset so we can animate next time it opens
                                setBoxReveal((prev) => ({ ...prev, [g.key]: false }))
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                const willOpen = !openGroups[g.key]
                                setOpenGroups((prev) => ({ ...prev, [g.key]: willOpen }))
                                if (willOpen) {
                                    setBoxReveal((prev) => ({ ...prev, [g.key]: false }))
                                    window.setTimeout(() => {
                                        setBoxReveal((prev) => ({ ...prev, [g.key]: true }))
                                    }, 50)
                                } else {
                                    setBoxReveal((prev) => ({ ...prev, [g.key]: false }))
                                }
                            }
                        }}
                        className="w-full px-3 py-2 text-left"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className={`flex min-w-0 items-center gap-3 ${headerFadeCls}`}>
                                {openGroups[g.key] ? (<ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />) : (<ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />)}
                                <div
                                    className="h-10 w-10 rounded-md ring-1 ring-inset ring-gray-200 dark:ring-white/10"
                                    style={{
                                        ...(g.color ? { backgroundColor: g.color } : {}),
                                        ...(g.imageUrl ? { backgroundImage: `url(${g.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
                                    }}
                                />
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white capitalize" title={g.label}>{g.label}</div>
                                    <div className={`flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${headerFadeCls}`}>
                                        {g.categoryName && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300">{g.categoryName}</span>)}
                                        {g.brand && <span>• {g.brand}</span>}
                                        <span>• {g.items.length} {t('cards.variants')}</span>
                                        <span>• {t('cards.totalStock')}: {g.totalStock}</span>
                                        {!openGroups[g.key] && (
                                            <span className="truncate">• {t('cards.sizes')}: {g.items.map((i) => i.size).filter(Boolean).slice(0, 4).join(", ")}{g.items.filter((i) => i.size).length > 4 ? "…" : ""}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`hidden sm:block text-right text-xs text-gray-600 dark:text-gray-300 ${headerFadeCls}`}>
                                    <div>{t('cards.price')}: {new Intl.NumberFormat(undefined, { style: "currency", currency: g.items[0]?.currency || "EUR" }).format(g.price)}</div>
                                    {typeof g.pricePaid === 'number' && (
                                        <div>{t('cards.cost')}: {new Intl.NumberFormat(undefined, { style: "currency", currency: g.items[0]?.currency || "EUR" }).format(g.pricePaid)}</div>
                                    )}
                                    <div>{t('cards.tax')}: {(g.taxRateBps / 100).toFixed(2)}%</div>
                                </div>
                                {g.items.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onAskEditBox(g.key) }}
                                        className="rounded-md border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                                        title={t('buttons.editBox')}
                                        aria-label={t('buttons.editBox')}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <span className='h-4 w-4 m-2'></span>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onAskDeleteBox(g.key) }}
                                    className="rounded-md border border-red-300 p-2 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                                    title={t('buttons.deleteBox')}
                                    aria-label={t('buttons.deleteBox')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {openGroups[g.key] && (
                        <div className="px-3 pb-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {g.items.map((it) => (
                                    <ItemCard
                                        key={it.id}
                                        item={it}
                                        reveal={reveal && !!boxReveal[g.key]}
                                        onItemUpdated={onItemUpdated}
                                        onItemDeleted={onItemDeleted}
                                        onConflict={onConflict}
                                        onSelect={onSelectItem}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
