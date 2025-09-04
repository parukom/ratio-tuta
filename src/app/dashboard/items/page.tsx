"use client"
import InnerItems from '@/components/admin-zone/items/InnerItems'
import React, { Suspense } from 'react'


export default function Items() {
    return (
        <Suspense>
            <InnerItems />
        </Suspense>
    )
}