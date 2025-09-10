import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import PlaceCard from './places/PlaceCard'
import CreatePlaceButton from './places/CreatePlaceButton'
import Spinner from '@/components/ui/Spinner'

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
    // trigger fade for cards after loading completes
    useEffect(() => {
        if (!placesLoading) {
            setReveal(false)
            const tm = window.setTimeout(() => setReveal(true), 50)
            return () => window.clearTimeout(tm)
        }
    }, [placesLoading, places.length])
    return (
        <div className="border-t border-gray-200 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between mb-6 px-4">
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
                    ? (
                        <div className="col-span-full flex items-center justify-center py-12">
                            <Spinner size={24} className="text-gray-400 dark:text-white/40" />
                        </div>
                    )
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