"use client"

import React from 'react'
import { ItemRow } from './types'
import LoadingRows from '@/components/ui/LoadingRows'
import { ItemRowActions } from './ItemRowActions'

type Props = {
    items: ItemRow[]
    loading: boolean
    onUpdate: (id: string, patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'size' | 'brand' | 'tags' | 'categoryId'>>, opts?: { categoryName?: string | null }) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

const columnWidths = ["w-56", "w-36", "w-24", "w-24", "w-16", "w-20", "w-20", "w-40"]

export default function ItemsTableView({ items, loading, onUpdate, onDelete }: Props) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Item</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">SKU</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Category</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Price</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Tax</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Unit</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Stock</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                    </tr>
                </thead>
                {loading ? (
                    <LoadingRows rows={8} columnWidths={columnWidths} />
                ) : items.length === 0 ? (
                    <tbody>
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">No items found.</td>
                        </tr>
                    </tbody>
                ) : (
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {items.map((it) => (
                            <tr key={it.id} className={!it.isActive ? "opacity-60" : ""}>
                                <td className="px-4 py-2">
                                    <div className="font-medium text-gray-900 dark:text-white">{it.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">#{it.id}</div>
                                </td>
                                <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.sku || "—"}</td>
                                <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.categoryName || "—"}</td>
                                <td className="px-2 py-2 text-right text-gray-900 dark:text-white">{new Intl.NumberFormat(undefined, { style: "currency", currency: it.currency || "EUR" }).format(it.price)}</td>
                                <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{(it.taxRateBps / 100).toFixed(2)}%</td>
                                <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{it.unit || "pcs"}</td>
                                <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{typeof it.stockQuantity === "number" ? it.stockQuantity : "0"}</td>
                                <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300"><ItemRowActions item={it} onUpdate={onUpdate} onDelete={onDelete} /></td>
                            </tr>
                        ))}
                    </tbody>
                )}
            </table>
        </div>
    )
}
