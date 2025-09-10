"use client"
import React from 'react'

type Props = {
    page: number
    totalPages: number
    onPrev: () => void
    onNext: () => void
    disabled?: boolean
    includeSidebarInset?: boolean
    withSpacer?: boolean
    prevLabel?: string
    nextLabel?: string
}

export default function BottomPaginationBar({
    page,
    totalPages,
    onPrev,
    onNext,
    disabled,
    includeSidebarInset,
    withSpacer = true,
    prevLabel = 'Prev',
    nextLabel = 'Next',
}: Props) {
    return (
        <>
            {withSpacer && <div aria-hidden className="h-16" />}
            <div
                className={
                    `fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur ` +
                    `supports-[backdrop-filter]:bg-white/60 safe-bottom dark:border-white/10 ` +
                    `dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60 ` +
                    `${includeSidebarInset ? 'lg:pl-72' : ''}`
                }
            >
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="relative flex items-center justify-center py-4">
                        <button
                            className="absolute left-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                            disabled={disabled || page <= 1}
                            onClick={onPrev}
                        >
                            {prevLabel}
                        </button>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {page} / {Math.max(1, totalPages)}
                        </div>
                        <button
                            className="absolute right-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                            disabled={disabled || page >= totalPages}
                            onClick={onNext}
                        >
                            {nextLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
