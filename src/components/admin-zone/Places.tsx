import React, { useEffect, useState } from 'react'
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
}


export default function Places() {
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
                            teamPeopleCount: 1,
                        },
                        ...prev,
                    ])
                }} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-6 lg:px-8">
                {placesLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    ))
                    : places.length === 0
                        ? (
                            <div className="col-span-full flex items-center justify-between rounded-lg border border-dashed border-gray-300 p-6 dark:border-white/10">
                                <p className="text-sm text-gray-500 dark:text-gray-400">No places yet.</p>
                                <CreatePlaceButton />
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
                                />
                            ))
                        )}
            </div>
        </div>
    )
}
