"use client"

import React from 'react'
import { Group, ItemRow } from './types'
import ItemCard from './ItemCard'
import LoadingCards from '@/components/ui/LoadingCards'
import LoadingGroupedCards from '@/components/ui/LoadingGroupedCards'
import { ChevronDown, ChevronRight } from 'lucide-react'

type Props = {
    items: ItemRow[]
    groups: Group[]
    grouped: boolean
    loading: boolean
    openGroups: Record<string, boolean>
    setOpenGroups: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void
    onUpdate: (id: string, patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'pricePaid' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'size' | 'brand' | 'tags' | 'categoryId'>>, opts?: { categoryName?: string | null }) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onAskDeleteBox: (groupKey: string) => void
    onAskEditBox: (groupKey: string) => void
    onSelectItem?: (item: ItemRow) => void
}

export default function ItemsCardsView({ items, groups, grouped, loading, openGroups, setOpenGroups, onUpdate, onDelete, onAskDeleteBox, onAskEditBox, onSelectItem }: Props) {
    if (loading) return grouped ? <LoadingGroupedCards className="mt-2" /> : <LoadingCards className="mt-2" />

    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">No items found.</div>
        )
    }

    if (!grouped) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((it) => (<ItemCard key={it.id} item={it} onUpdate={onUpdate} onDelete={onDelete} onSelect={onSelectItem} />))}
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
                        onClick={() => setOpenGroups((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setOpenGroups((prev) => ({ ...prev, [g.key]: !prev[g.key] }))
                            }
                        }}
                        className="w-full px-3 py-2 text-left"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
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
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        {g.categoryName && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300">{g.categoryName}</span>)}
                                        {g.brand && <span>• {g.brand}</span>}
                                        <span>• {g.items.length} variants</span>
                                        <span>• Total stock: {g.totalStock}</span>
                                        {!openGroups[g.key] && (
                                            <span className="truncate">• sizes: {g.items.map((i) => i.size).filter(Boolean).slice(0, 4).join(", ")}{g.items.filter((i) => i.size).length > 4 ? "…" : ""}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block text-right text-xs text-gray-600 dark:text-gray-300">
                                    <div>Price: {new Intl.NumberFormat(undefined, { style: "currency", currency: g.items[0]?.currency || "EUR" }).format(g.price)}</div>
                                    {typeof g.pricePaid === 'number' && (
                                        <div>Cost: {new Intl.NumberFormat(undefined, { style: "currency", currency: g.items[0]?.currency || "EUR" }).format(g.pricePaid)}</div>
                                    )}
                                    <div>Tax: {(g.taxRateBps / 100).toFixed(2)}%</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onAskEditBox(g.key) }}
                                    className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                                    title="Edit box"
                                >
                                    Edit box
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onAskDeleteBox(g.key) }}
                                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                                    title="Delete whole box"
                                >
                                    Delete box
                                </button>
                            </div>
                        </div>
                    </div>
                    {openGroups[g.key] && (
                        <div className="px-3 pb-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {g.items.map((it) => (<ItemCard key={it.id} item={it} onUpdate={onUpdate} onDelete={onDelete} onSelect={onSelectItem} />))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
