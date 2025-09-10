"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import PlaceCard from './places/PlaceCard'
import Spinner from '@/components/ui/Spinner'

export type Place = {
    id: string
    teamId: string
    name: string
    description?: string | null
    city?: string | null
    country?: string | null
    currency?: string | null
    totalEarnings: number
    placeTypeId?: string | null
    createdAt: string
    isActive: boolean
    teamPeopleCount: number
    // Aggregates for card UI
    itemsCount: number
    stockUnits: number
    receiptsToday: number
    salesToday: number
    receipts7d: number
    lastActivityAt: string | null
}


export default function Places({ query = '' }: { query?: string }) {
    const t = useTranslations('Home')
    const [places, setPlaces] = useState<Place[]>([])
    const [placesLoading, setPlacesLoading] = useState(true)
    const [reveal, setReveal] = useState(false)


    // Fetch places when on places tab
    useEffect(() => {
        let cancelled = false
        setPlacesLoading(true)
        fetch('/api/places', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data: Place[]) => {
                if (!cancelled) setPlaces(data)
            })
            .catch(() => {
                if (!cancelled) setPlaces([])
            })
            .finally(() => {
                if (!cancelled) setPlacesLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])
    // Listen for create events to optimistically prepend
    useEffect(() => {
        const handler = (ev: Event) => {
            const e = ev as CustomEvent<{ id: string; name: string }>
            const now = new Date().toISOString()
            setPlaces((prev) => [
                {
                    id: e.detail.id,
                    teamId: 'unknown',
                    name: e.detail.name,
                    description: '',
                    city: '',
                    country: '',
                    currency: 'EUR',
                    totalEarnings: 0,
                    placeTypeId: null,
                    createdAt: now,
                    isActive: true,
                    teamPeopleCount: 0,
                    itemsCount: 0,
                    stockUnits: 0,
                    receiptsToday: 0,
                    salesToday: 0,
                    receipts7d: 0,
                    lastActivityAt: null,
                },
                ...prev,
            ])
        }
        window.addEventListener('place:created', handler as EventListener)
        return () => window.removeEventListener('place:created', handler as EventListener)
    }, [])

    // trigger fade for cards after loading completes
    useEffect(() => {
        if (!placesLoading) {
            setReveal(false)
            const tm = window.setTimeout(() => setReveal(true), 50)
            return () => window.clearTimeout(tm)
        }
    }, [placesLoading, places.length])
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return places
        return places.filter((p) =>
            (p.name ?? '').toLowerCase().includes(q)
            || (p.city ?? '').toLowerCase().includes(q)
            || (p.country ?? '').toLowerCase().includes(q)
        )
    }, [places, query])

    return (
        <div className="border-t border-gray-200 dark:border-white/10">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
                {placesLoading
                    ? (
                        <div className="col-span-full flex items-center justify-center py-12">
                            <Spinner size={24} className="text-gray-400 dark:text-white/40" />
                        </div>
                    )
                    : filtered.length === 0
                        ? (
                            <div className="col-span-full flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-6 dark:border-white/10">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('places.empty')}</p>
                            </div>
                        )
                        : (
                            filtered.map((p) => (
                                <PlaceCard
                                    id={p.id}
                                    key={p.id}
                                    reveal={reveal}
                                    name={p.name}
                                    description={p.description}
                                    totalEarnings={p.totalEarnings}
                                    teamPeopleCount={p.teamPeopleCount}
                                    currency={p.currency}
                                    city={p.city}
                                    country={p.country}
                                    isActive={p.isActive}
                                    itemsCount={p.itemsCount}
                                    stockUnits={p.stockUnits}
                                    receiptsToday={p.receiptsToday}
                                    salesToday={p.salesToday}
                                    receipts7d={p.receipts7d}
                                    lastActivityAt={p.lastActivityAt}
                                    onDelete={(id) => setPlaces((prev) => prev.filter((x) => x.id !== id))}
                                />
                            ))
                        )}
            </div>
        </div >

    )
}