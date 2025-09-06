"use client"
import InnerItems from '@/components/admin-zone/items/InnerItems'
import React, { Suspense } from 'react'


export default function Items() {
    return (
        <Suspense>
            {/* Title could be used by InnerItems soon; keep page ready for i18n */}
            <InnerItems />
        </Suspense>
    )
}