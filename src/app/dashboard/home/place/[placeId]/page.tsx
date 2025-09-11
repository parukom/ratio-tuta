'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Tabs from '@/components/ui/Tabs'
import { useTranslations } from 'next-intl'
import { PlacesItems } from '@/components/admin-zone/PlacesItems'
import type { Place } from '@/components/admin-zone/places/types'
import { PlacesMembers } from '@/components/admin-zone/PlacesMembers'
import { PlaceSettings } from '@/components/admin-zone/PlaceSettings'



function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function PlaceDetailPage() {
    const t = useTranslations('Home')
    const tc = useTranslations('Common')
    const params = useParams<{ placeId: string }>()
    const placeId = params?.placeId
    const searchParams = useSearchParams()
    const router = useRouter()
    const tab = (searchParams.get('tab') ?? 'overview') as 'overview' | 'items' | 'members' | 'settings'
    const setTab = (t: 'overview' | 'items' | 'members' | 'settings') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('tab', t)
        router.push(`?${params.toString()}`)
    }
    const [place, setPlace] = useState<Place | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // lightweight counts for tab badges
    const [itemsCount, setItemsCount] = useState(0)
    const [membersCount, setMembersCount] = useState(0)

    useEffect(() => {
        let cancelled = false
        if (!placeId) return
        setLoading(true)
        setError(null)

        // Try to hydrate from localStorage first
        try {
            const cached = localStorage.getItem(`place:${placeId}`)
            if (cached) {
                const parsed = JSON.parse(cached) as Place
                if (!cancelled) {
                    setPlace(parsed)
                    // keep loading true to indicate we are refreshing in background
                }
            }
        } catch {
            // ignore parse errors
        }

        fetch(`/api/places/${placeId}`)
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error'))))
            .then((data: Place) => {
                if (!cancelled) {
                    setPlace(data)
                    try {
                        localStorage.setItem(`place:${placeId}`, JSON.stringify(data))
                    } catch {
                        // ignore storage errors (e.g., quota)
                    }
                }
            })
            .catch((e) => {
                if (!cancelled) setError(typeof e === 'string' ? e : t('place.errors.load'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [placeId, t])

    // children manage items/members state and modals internally

    const [copied, setCopied] = useState(false)
    async function copyPlaceId() {
        try {
            await navigator.clipboard.writeText(String(placeId))
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // noop
        }
    }


    const stats = useMemo(() => {
        const currency = place?.currency || 'EUR'
        const total = place?.totalEarnings ?? 0
        // Use a fixed locale to avoid server/client locale differences during hydration
        return [
            { name: 'Total earnings', value: new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(total) },
            { name: 'Average ticket', value: '—' },
            { name: 'Items sold', value: '—' },
            { name: 'Active items', value: '—' },
        ]
    }, [place])

    return (
        <div>
            <header className="border-b border-gray-200 dark:border-white/5">
                {/* Heading */}
                <div className="lg:-mt-3 flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-2 sm:flex-row sm:items-center dark:bg-gray-700/10">
                    <div className='flex justify-between w-full py-[5.5px] md:p-1  md:mt-[15px]'>
                        <span className="flex items-center gap-x-3">
                            <div className={`flex-none rounded-full p-1 ${place?.isActive ? 'bg-green-500/10 text-green-500 dark:bg-green-400/10 dark:text-green-400' : 'bg-gray-400/10 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400'}`}>
                                <div className="size-2 rounded-full bg-current" />
                            </div>
                            <h1 className="flex flex-wrap items-center gap-x-3 text-base/7">
                                <span className="font-semibold text-gray-900 dark:text-white">{place?.name || t('place.title')}</span>
                                <span className='hidden lg:inline-block'>
                                    <span className="text-gray-400 dark:text-gray-600">/ </span>
                                    <button onClick={copyPlaceId} className="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
                                        #{placeId}{copied ? ` · ${tc('copied')}` : ''}
                                    </button>
                                </span>
                            </h1>
                        </span>
                        <Link
                            aria-label={t('place.openRegister')}
                            href={`/cash-register?placeId=${encodeURIComponent(String(placeId))}`}
                            className="inline-flex text-nowrap items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                            {t('place.openRegister')}
                        </Link>
                    </div>
                </div>

                {/* breadcrumbs */}
                <div className="px-4 py-4 border-y border-gray-200 dark:border-white/5">
                    <Breadcrumbs
                        items={[
                            { name: t('breadcrumbs.places'), href: '/dashboard/home?tab=places' },
                            { name: place?.name || t('place.title') },
                        ]}
                    />
                </div>

                {/* Tabs */}
                <div className='py-4 '>
                    <Tabs
                        items={[
                            { key: 'overview', label: t('place.tabs.overview') },
                            { key: 'items', label: `${t('place.tabs.items')}${itemsCount ? ` (${itemsCount})` : ''}` },
                            { key: 'members', label: `${t('place.tabs.members')}${membersCount ? ` (${membersCount})` : ''}` },
                            { key: 'settings', label: t('place.tabs.settings') },
                        ]}
                        activeKey={tab}
                        onChange={(k) => setTab(k as typeof tab)}
                    />
                </div>

                {/* Overview stats */}
                {tab === 'overview' && (
                    <div className="grid grid-cols-1 bg-gray-50 sm:grid-cols-2 lg:grid-cols-4 dark:bg-gray-700/10">
                        {stats.map((stat, statIdx) => (
                            <div
                                key={stat.name}
                                className={classNames(
                                    statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                                    'border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5',
                                )}
                            >
                                <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                                <p className="mt-2 flex items-baseline gap-x-2">
                                    <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                        {stat.value}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </header>

            {/* Content */}
            <main className="p-4">

                {loading ? (
                    <div className="h-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                ) : error ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-6">



                        {tab === 'settings' && (
                            <PlaceSettings place={place as Place} router={router} onSaved={(p) => setPlace(p)} />
                        )}

                        {tab === 'members' && (
                            <PlacesMembers placeId={String(placeId)} onCountChange={setMembersCount} />
                        )}

                        {tab === 'items' && (
                            <PlacesItems placeId={String(placeId)} currency={place?.currency || 'EUR'} onCountChange={setItemsCount} />
                        )}
                    </div>
                )}
            </main>
            {/* Modals are handled inside PlacesItems and PlacesMembers */}
        </div >
    )
}
