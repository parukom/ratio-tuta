import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import PlaceCard from './places/PlaceCard'
import CreatePlaceButton from './places/CreatePlaceButton'

type Place = {
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


export default function Places() {
    const t = useTranslations('Home')
    const [places, setPlaces] = useState<Place[]>([])
    const [placesLoading, setPlacesLoading] = useState(true)


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
    return (
        <div className="border-t border-gray-200 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
                <span></span>
                <CreatePlaceButton onCreated={(p) => {
                    // Optimistically add the new place to the list top
                    setPlaces((prev) => [
                        {
                            id: p.id,
                            teamId: 'unknown',
                            name: p.name,
                            description: '',
                            city: '',
                            country: '',
                            currency: 'EUR',
                            totalEarnings: 0,
                            placeTypeId: null,
                            createdAt: new Date().toISOString(),
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
                }} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-6 lg:px-8">
                {placesLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <PlaceCardSkeleton key={i} />
                    ))
                    : places.length === 0
                        ? (
                            <div className="col-span-full flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-6 dark:border-white/10">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('places.empty')}</p>
                            </div>
                        )
                        : (
                            places.map((p) => (
                                <PlaceCard
                                    id={p.id}
                                    key={p.id}
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

function PlaceCardSkeleton() {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Title */}
                    <div className="relative h-4 w-32 rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                    {/* Description */}
                    <div className="relative mt-2 h-3 w-48 rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                    {/* Tags */}
                    <div className="mt-3 flex gap-2">
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="relative h-4 w-16 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden"
                            >
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Today summary */}
                <div className="text-right">
                    <div className="relative h-3 w-10 rounded bg-gray-200 dark:bg-white/10 overflow-hidden ml-auto">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                    <div className="relative mt-2 h-6 w-20 rounded bg-gray-200 dark:bg-white/10 overflow-hidden ml-auto">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                    <div className="relative mt-2 h-3 w-16 rounded bg-gray-200 dark:bg-white/10 overflow-hidden ml-auto">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 flex gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center rounded-xl bg-gray-50 p-4 dark:bg-white/5 flex-1"
                    >
                        {/* Icon placeholder */}
                        <div className="relative h-4 w-auto rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                        </div>
                        {/* Value placeholder */}
                        <div className="relative mt-3 h-5 w-10 rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between">
                {/* Last activity */}
                <div className="relative h-3 w-32 rounded bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                    <div className="relative h-8 w-16 rounded-lg bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                    <div className="relative h-8 w-20 rounded-lg bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                    </div>
                </div>
            </div>
        </div>
    )
}