"use client"

import { LayoutGrid, Table as TableIcon, RotateCcw } from "lucide-react"
import Dropdown from "@/components/ui/Dropdown"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/ui/SearchInput"
import { useTranslations } from "next-intl"
import React from "react"
import Drawer from "@/components/ui/Drawer"
import { SlidersHorizontal } from "lucide-react"

type Category = { id: string; name: string }

type Props = {
    q: string
    setQ: (v: string) => void
    inStock: boolean
    setInStock: (v: boolean) => void
    onlyActive: boolean
    setOnlyActive: (v: boolean) => void
    view: "cards" | "table"
    setView: (v: "cards" | "table") => void
    grouped: boolean
    setGrouped: (v: boolean) => void
    onExpandAll?: () => void
    onCollapseAll?: () => void
    categories: Category[]
    categoryId: string
    setCategoryId: (id: string) => void
    minPrice: string
    setMinPrice: (v: string) => void
    maxPrice: string
    setMaxPrice: (v: string) => void
    sort: string
    setSort: (v: string) => void
    onReset: () => void
}

export default function ItemsHeader({
    q, setQ,
    inStock, setInStock,
    onlyActive, setOnlyActive,
    view, setView,
    grouped, setGrouped,
    onExpandAll, onCollapseAll,
    categories, categoryId, setCategoryId,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    sort, setSort,
    onReset,
}: Props) {
    const t = useTranslations('Items')
    const common = useTranslations('Common')
    const cash = useTranslations('CashRegister')
    const [filtersOpen, setFiltersOpen] = React.useState(false)
    return (
        <header className="sticky top-0 z-10 lg:rounded-xl border-y lg:border border-gray-200 bg-white p-3 shadow-xs dark:border-white/10 dark:bg-gray-900">
            <div className="flex flex-col gap-4">
                <header className="w-full flex gap-4 flex-wrap items-center">
                    <div className="relative min-w-56 flex-1">
                        <SearchInput
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('header.searchPlaceholder')}
                            containerClassName=""
                            inputClassName="block w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 sm:text-sm/6"
                        />
                    </div>
                    {/* Filters button (all breakpoints) */}
                    <div className="ml-auto">
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5"
                            title={cash('filters', { default: 'Filters' })}
                        >
                            <SlidersHorizontal className="size-4" />
                            <span>{cash('filters', { default: 'Filters' })}</span>
                        </button>
                    </div>
                </header>
            </div>
            {/* All filters are now accessed via the Drawer to save space on desktop. */}

            {/* Mobile Drawer with filters */}
            <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} side="right" title={cash('filters', { default: 'Filters' })}>
                <div className="space-y-6">
                    {/* Category */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('header.allCategories')}</h3>
                        <Dropdown
                            align="left"
                            buttonLabel={categoryId ? (categories.find(c => c.id === categoryId)?.name ?? t('header.allCategories')) : t('header.allCategories')}
                            items={[{ key: "", label: t('header.allCategories') }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                            onSelect={(key) => setCategoryId(key)}
                        />
                    </section>

                    {/* In stock */}
                    <section>
                        <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:text-gray-200">
                            <span>{t('header.inStock')}</span>
                            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                        </label>
                    </section>

                    {/* Price range */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{common('price', { default: 'Price' })}</h3>
                        <div className="flex items-center gap-2">
                            <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder={t('header.minPrice')} className="px-2" hideLabel />
                            <span className="text-gray-400">-</span>
                            <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t('header.maxPrice')} className="px-2" hideLabel />
                        </div>
                    </section>

                    {/* Sort */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('header.sort.label')}</h3>
                        {(() => {
                            const sortOptions = [
                                { key: "createdAt_desc", label: t('header.sort.newest') },
                                { key: "createdAt_asc", label: t('header.sort.oldest') },
                                { key: "name_asc", label: t('header.sort.nameAsc') },
                                { key: "name_desc", label: t('header.sort.nameDesc') },
                                { key: "price_asc", label: t('header.sort.priceAsc') },
                                { key: "price_desc", label: t('header.sort.priceDesc') },
                                { key: "stock_asc", label: t('header.sort.stockAsc') },
                                { key: "stock_desc", label: t('header.sort.stockDesc') },
                                { key: "tax_asc", label: t('header.sort.taxAsc') },
                                { key: "tax_desc", label: t('header.sort.taxDesc') },
                            ]
                            const current = sortOptions.find(o => o.key === sort)?.label ?? t('header.sort.label')
                            return (
                                <Dropdown align="left" buttonLabel={current} items={sortOptions} onSelect={(key) => setSort(key)} />
                            )
                        })()}
                    </section>

                    {/* View toggle */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('header.view.cards')}</h3>
                        <div className="flex items-center gap-1 rounded-md bg-gray-50 p-1 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
                            <button type="button" onClick={() => setView("cards")} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${view === "cards" ? "bg-white text-gray-900 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-white/10" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`} title={t('header.view.cards')}><LayoutGrid className="size-3.5" /> </button>
                            <button type="button" onClick={() => setView("table")} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${view === "table" ? "bg-white text-gray-900 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-white/10" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`} title={t('header.view.table')}><TableIcon className="size-3.5" /> </button>
                        </div>
                    </section>

                    {/* Active only and grouping */}
                    <section className="space-y-3">
                        <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:text-gray-200">
                            <span>{t('header.activeOnly')}</span>
                            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
                        </label>
                        {view === 'cards' && (
                            <div className="space-y-2">
                                <label className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:text-gray-200">
                                    <span>{t('header.groupByBox')}</span>
                                    <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />
                                </label>
                                {grouped && (
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={onExpandAll} className="flex-1 rounded px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5">{t('header.expandAll')}</button>
                                        <button type="button" onClick={onCollapseAll} className="flex-1 rounded px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5">{t('header.collapseAll')}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Actions */}
                    <section className="flex items-center gap-2 pt-2">
                        <button type="button" onClick={onReset} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5">
                            <RotateCcw className="size-4" /> {t('header.reset')}
                        </button>
                        <button type="button" onClick={() => setFiltersOpen(false)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                            {common('close', { default: 'Close' })}
                        </button>
                    </section>
                </div>
            </Drawer>
        </header>
    )
}
