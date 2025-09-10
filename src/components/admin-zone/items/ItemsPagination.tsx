"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import BottomPaginationBar from '@/components/ui/BottomPaginationBar'

type Props = {
    page: number
    setPage: (n: number) => void
    totalPages: number
    disabled?: boolean
}

export default function ItemsPagination({ page, setPage, totalPages, disabled }: Props) {
    const tDoc = useTranslations('Documents')
    return (
        <BottomPaginationBar
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage(Math.max(1, page - 1))}
            onNext={() => setPage(page + 1)}
            disabled={disabled}
            includeSidebarInset
            prevLabel={tDoc('pagination.prev')}
            nextLabel={tDoc('pagination.next')}
        />
    )
}
