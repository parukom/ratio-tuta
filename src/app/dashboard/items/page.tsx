"use client"
import { ItemsInner } from '@/components/admin-zone/items/InnerItems'
import React, { Suspense } from 'react'


export default function Items() {
    return (
        <Suspense>
            <ItemsInner />
        </Suspense>
    )
}