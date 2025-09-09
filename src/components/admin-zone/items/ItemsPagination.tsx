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
        <>
            {/* Spacer so content isn't hidden behind the fixed bar */}
            <div aria-hidden className="h-16" />

            {/* Fixed bottom pagination bar */}
            <div className="lg:pl-72 fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {tDoc('pagination.pageOf', { page, total: totalPages })}
                        </div>
                        <div className="flex gap-2 py-4">
                            <button
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                                disabled={page <= 1 || disabled}
                                onClick={() => setPage(Math.max(1, page - 1))}
                            >
                                {tDoc('pagination.prev')}
                            </button>
                            <button
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                                disabled={page >= totalPages || disabled}
                                onClick={() => setPage(page + 1)}
                            >
                                {tDoc('pagination.next')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
