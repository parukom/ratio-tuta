"use client"

import React from 'react'
import { useTranslations } from 'next-intl'

type Props = {
    page: number
    setPage: (n: number) => void
    totalPages: number
    disabled?: boolean
}

export default function ItemsPagination({ page, setPage, totalPages, disabled }: Props) {
    const tDoc = useTranslations('Documents')
    return (
        <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
                {tDoc('pagination.pageOf', { page, total: totalPages })}
            </div>
            <div className="flex gap-2">
                <button
                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                    disabled={page <= 1 || disabled}
                    onClick={() => setPage(Math.max(1, page - 1))}
                >
                    {tDoc('pagination.prev')}
                </button>
                <button
                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                    disabled={page >= totalPages || disabled}
                    onClick={() => setPage(page + 1)}
                >
                    {tDoc('pagination.next')}
                </button>
            </div>
        </div>
    )
}
