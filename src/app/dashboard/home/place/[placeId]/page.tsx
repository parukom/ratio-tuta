'use client'
import React, { useEffect, useMemo, useState } from 'react'
import AddItemsToPlaceModal from '@/components/admin-zone/places/AddItemsToPlaceModal'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/modals/Modal'
import Dropdown from '@/components/ui/Dropdown'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Tabs from '@/components/ui/Tabs'
import DeletePlaceButton from '@/components/admin-zone/places/DeletePlaceButton'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'
import { PlacesItems } from '@/components/admin-zone/PlacesItems'
import type { Place } from '@/components/admin-zone/places/types'

type Member = { id: string; userId: string; name: string; createdAt: string }

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
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false)
    const [assignedItems, setAssignedItems] = useState<Array<{ id: string; itemId: string; quantity: number; item?: { id: string; name: string; sku?: string | null; price: number; measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME' } }>>([])
    const [assignedLoading, setAssignedLoading] = useState(true)
    const [assignedError, setAssignedError] = useState<string | null>(null)
    const [assignedReveal, setAssignedReveal] = useState(false)
    // Members state
    const [members, setMembers] = useState<Member[]>([])
    const [membersLoading, setMembersLoading] = useState(true)
    const [membersError, setMembersError] = useState<string | null>(null)
    const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])
    const [teamMembersLoading, setTeamMembersLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    // Remove member modal state
    const [removeOpen, setRemoveOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
    const [removeLoading, setRemoveLoading] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)
    // Edit form state
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editAddress1, setEditAddress1] = useState('')
    const [editAddress2, setEditAddress2] = useState('')
    const [editCity, setEditCity] = useState('')
    const [editCountry, setEditCountry] = useState('')
    const [editTimezone, setEditTimezone] = useState('')
    const [editCurrency, setEditCurrency] = useState('')
    const [editActive, setEditActive] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveMessage, setSaveMessage] = useState<string | null>(null)

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
                    // initialize edit form
                    setEditName(data.name || '')
                    setEditDescription(data.description || '')
                    setEditAddress1(data.address1 || '')
                    setEditAddress2(data.address2 || '')
                    setEditCity(data.city || '')
                    setEditCountry(data.country || '')
                    setEditTimezone(data.timezone || '')
                    setEditCurrency(data.currency || 'EUR')
                    setEditActive(!!data.isActive)
                    // persist to localStorage for next visits
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

    // Fade-in reveal for assigned items after loading completes
    useEffect(() => {
        if (!assignedLoading) {
            setAssignedReveal(false)
            const tm = window.setTimeout(() => setAssignedReveal(true), 50)
            return () => window.clearTimeout(tm)
        }
    }, [assignedLoading, assignedItems.length])

    // When place changes from cache hydration, sync form as well
    useEffect(() => {
        if (!place) return
        setEditName(place.name || '')
        setEditDescription(place.description || '')
        setEditAddress1(place.address1 || '')
        setEditAddress2(place.address2 || '')
        setEditCity(place.city || '')
        setEditCountry(place.country || '')
        setEditTimezone(place.timezone || '')
        setEditCurrency(place.currency || 'EUR')
        setEditActive(!!place.isActive)
    }, [place])

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        if (!placeId) return
        setSaveLoading(true)
        setSaveMessage(null)
        try {
            const res = await fetch(`/api/places/${placeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                    address1: editAddress1.trim() || null,
                    address2: editAddress2.trim() || null,
                    city: editCity.trim() || null,
                    country: editCountry.trim() || null,
                    timezone: editTimezone.trim() || null,
                    currency: editCurrency.trim() || null,
                    isActive: !!editActive,
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || tc('errors.failedToSave'))
            setPlace(data)
            try { localStorage.setItem(`place:${placeId}`, JSON.stringify(data)) } catch { }
            setSaveMessage(tc('saved'))
            setTimeout(() => setSaveMessage(null), 1500)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setSaveMessage(err?.message || tc('errors.failedToSave'))
        } finally {
            setSaveLoading(false)
        }
    }
    async function removeFromShop(itemId: string) {
        if (!placeId) return
        const res = await fetch(`/api/places/${placeId}/items`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data?.error || tc('errors.failedToRemove'))
            return
        }
        setAssignedItems(prev => prev.filter(r => r.itemId !== itemId))
    }

    const [infoOpen, setInfoOpen] = useState(false)
    const [infoLoading, setInfoLoading] = useState(false)
    const [info, setInfo] = useState<null | {
        id: string;
        teamId: string;
        name: string;
        sku: string | null;
        categoryId: string | null;
        price: number;
        taxRateBps: number;
        isActive: boolean;
        unit: string;
        measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
        stockQuantity: number;
        createdAt: string;
        updatedAt: string;
        placeQuantity: number;
    }>(null)

    async function openInfo(itemId: string, placeQuantity: number) {
        setInfoOpen(true)
        setInfoLoading(true)
        try {
            const res = await fetch(`/api/items/${itemId}`)
            if (!res.ok) throw new Error(tc('errors.failedToLoad'))
            const data = await res.json()
            setInfo({
                id: data.id,
                teamId: data.teamId,
                name: data.name,
                sku: data.sku ?? null,
                categoryId: data.categoryId ?? null,
                price: data.price,
                taxRateBps: data.taxRateBps,
                isActive: data.isActive,
                unit: data.unit,
                measurementType: data.measurementType,
                stockQuantity: data.stockQuantity ?? 0,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                placeQuantity,
            })
        } catch {
            setInfo(null)
        } finally {
            setInfoLoading(false)
        }
    }

    // Load items assigned to this place
    useEffect(() => {
        if (!placeId) return
        let cancelled = false
        setAssignedLoading(true)
        setAssignedError(null)
        fetch(`/api/places/${placeId}/items`)
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Error'))))
            .then((rows: Array<{ id: string; placeId: string; itemId: string; quantity: number; item: { id: string; name: string; sku?: string | null; price: number } }>) => {
                if (!cancelled) setAssignedItems(rows)
            })
            .catch((e) => {
                if (!cancelled) setAssignedError(typeof e === 'string' ? e : 'Failed to load assigned items')
            })
            .finally(() => {
                if (!cancelled) setAssignedLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [placeId, t])

    // Load members for this place
    useEffect(() => {
        if (!placeId) return
        let cancelled = false
        setMembersLoading(true)
        setMembersError(null)
        fetch(`/api/places/${placeId}/members`, { credentials: 'include' })
            .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.json().catch(() => ({ error: 'Failed' })))))
            .then((data: Member[]) => { if (!cancelled) setMembers(data) })
            .catch((e: unknown) => {
                const err = e as { error?: string } | string;
                if (!cancelled) setMembersError(typeof err === 'string' ? err : (typeof err?.error === 'string' ? err.error : 'Failed to load members'))
            })
            .finally(() => { if (!cancelled) setMembersLoading(false) })
        return () => { cancelled = true }
    }, [placeId, t, tc])

    // Load team members for this place's team (when place is known)
    useEffect(() => {
        if (!place?.teamId) return
        let cancelled = false
        setTeamMembersLoading(true)
        fetch(`/api/teams/${place.teamId}/members`, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Failed'))))
            .then((rows: Array<{ userId: string; name: string; email?: string | null }>) => {
                if (cancelled) return
                setTeamMembers(rows.map(r => ({ userId: r.userId, name: r.name })))
            })
            .catch(() => { if (!cancelled) setTeamMembers([]) })
            .finally(() => { if (!cancelled) setTeamMembersLoading(false) })
        return () => { cancelled = true }
    }, [place?.teamId, tc])

    async function addMemberByUserId(userId: string) {
        if (!userId) return
        setSubmitting(true)
        setMembersError(null)
        try {
            const res = await fetch(`/api/places/${placeId}/members`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to add')
            const list = await fetch(`/api/places/${placeId}/members`, { credentials: 'include' })
            if (list.ok) setMembers(await list.json())
        } catch (e: unknown) {
            const err = e as { message?: string };
            setMembersError(err?.message || 'Failed to add')
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmRemoveMember() {
        if (!removeTarget || !placeId) return
        setRemoveLoading(true)
        setRemoveError(null)
        try {
            const res = await fetch(`/api/places/${placeId}/members`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId: removeTarget.userId })
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || tc('errors.failedToRemove'))
            }
            setMembers((prev) => prev.filter((m) => m.userId !== removeTarget.userId))
            setRemoveOpen(false)
            setRemoveTarget(null)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setRemoveError(err?.message || tc('errors.failedToRemove'))
        } finally {
            setRemoveLoading(false)
        }
    }

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
                            { key: 'items', label: `${t('place.tabs.items')}${assignedItems.length ? ` (${assignedItems.length})` : ''}` },
                            { key: 'members', label: `${t('place.tabs.members')}${members.length ? ` (${members.length})` : ''}` },
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
                            <>
                                {/* general settings */}
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                                    <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{t('place.settings.general')}</h2>
                                    <form onSubmit={saveSettings} className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Input id="name" name="name" type="text" placeholder={t('place.form.name')} value={editName} onChange={(e) => setEditName(e.target.value)} />
                                            <Input id="description" name="description" type="text" placeholder={t('place.form.descriptionOptional')} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Input id="address1" name="address1" type="text" placeholder={t('place.form.address1')} value={editAddress1} onChange={(e) => setEditAddress1(e.target.value)} />
                                            <Input id="address2" name="address2" type="text" placeholder={t('place.form.address2')} value={editAddress2} onChange={(e) => setEditAddress2(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Input id="city" name="city" type="text" placeholder={t('place.form.city')} value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                                            <Input id="country" name="country" type="text" placeholder={t('place.form.country')} value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Input id="timezone" name="timezone" type="text" placeholder={t('place.form.timezone')} value={editTimezone} onChange={(e) => setEditTimezone(e.target.value)} />
                                            <Input id="currency" name="currency" type="text" placeholder={t('place.form.currency')} value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input id="isActive" name="isActive" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="size-4" />
                                            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">{t('place.form.active')}</label>
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            {saveMessage && (
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{saveMessage}</span>
                                            )}
                                            <button type="submit" disabled={saveLoading} aria-busy={saveLoading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                                                {saveLoading && <Spinner size={16} className="text-white" />}
                                                <span>{saveLoading ? tc('saving') : t('place.actions.saveChanges')}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* danger zone */}
                                <div className='divide-y divide-gray-200 dark:divide-white/10'>
                                    <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                                        <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{t('place.settings.danger.title')}</h2>
                                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('place.settings.danger.note')}</p>
                                        {place && (
                                            <DeletePlaceButton
                                                placeId={place.id}
                                                placeName={place.name}
                                                size="md"
                                                onDeleted={() => {
                                                    // After deletion, go back to places list
                                                    router.push('/dashboard/home?tab=places')
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'members' && (
                            <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                                <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{t('place.tabs.members')}</h2>
                                <div className="mb-3 flex items-center gap-2">
                                    {(() => {
                                        const available = teamMembers.filter(tm => !members.some(m => m.userId === tm.userId))
                                        const label = teamMembersLoading ? tc('loading') : available.length ? t('place.members.addMember') : t('place.members.noneAvailable')
                                        return (
                                            <Dropdown
                                                buttonLabel={label}
                                                disabled={teamMembersLoading || submitting || available.length === 0}
                                                align="left"
                                                items={available.map(tm => ({ key: tm.userId, label: tm.name, onSelect: (key) => addMemberByUserId(key) }))}
                                            />
                                        )
                                    })()}
                                </div>
                                {membersError && <p className="mb-2 text-sm text-rose-600 dark:text-rose-400">{membersError}</p>}
                                <div className="overflow-hidden rounded border border-gray-200 dark:border-white/10">
                                    {membersLoading ? (
                                        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">{tc('loading')}</div>
                                    ) : members.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-600 dark:text-gray-300">{t('place.members.empty')}</div>
                                    ) : (
                                        <ul className="divide-y divide-gray-200 dark:divide-white/10">
                                            {members.map((m) => (
                                                <li key={m.id} className="flex items-center justify-between px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</div>
                                                    <button onClick={() => { setRemoveTarget(m); setRemoveOpen(true); }} className="text-sm text-rose-600 hover:underline dark:text-rose-400">{tc('delete')}</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {tab === 'items' && (
                            <PlacesItems
                                setIsAddItemsOpen={setIsAddItemsOpen}
                                assignedLoading={assignedLoading}
                                assignedError={assignedError}
                                assignedItems={assignedItems}
                                assignedReveal={assignedReveal}
                                place={place as Place}
                                openInfo={openInfo}
                                removeFromShop={removeFromShop}
                            />
                        )}
                    </div>
                )}
            </main>
            <AddItemsToPlaceModal
                placeId={String(placeId)}
                open={isAddItemsOpen}
                onClose={() => setIsAddItemsOpen(false)}
                onAdded={() => {
                    // refresh assigned list
                    if (!placeId) return
                    setAssignedLoading(true)
                    fetch(`/api/places/${placeId}/items`).then((r) => r.json()).then((rows) => setAssignedItems(rows)).finally(() => setAssignedLoading(false))
                }}
            />
            {/* Remove member confirmation modal */}
            <Modal open={removeOpen} onClose={() => { if (!removeLoading) { setRemoveOpen(false); setRemoveError(null) } }} size="sm">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('place.members.removeTitle')}</h3>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>{t('place.members.confirmRemove')}</p>
                    {removeTarget && (
                        <p className="mt-2"><span className="font-medium">{removeTarget.name}</span></p>
                    )}
                    {removeError && <p className="mt-2 text-rose-600 dark:text-rose-400">{removeError}</p>}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" disabled={removeLoading} onClick={() => setRemoveOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('cancel')}</button>
                    <button type="button" disabled={removeLoading} onClick={confirmRemoveMember} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${removeLoading ? 'bg-rose-600/70 text-white' : 'bg-rose-600 text-white hover:bg-rose-500'}`}>
                        {removeLoading ? tc('deleting') : tc('delete')}
                    </button>
                </div>
            </Modal>
            {/* Item info modal */}
            <Modal open={infoOpen} onClose={() => setInfoOpen(false)} size="md">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('place.items.infoTitle')}</h3>
                {infoLoading ? (
                    <div className="mt-3 h-16 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                ) : info ? (
                    <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div><span className="font-medium">{tc('name')}:</span> {info.name}</div>
                        <div><span className="font-medium">{t('place.items.itemId')}:</span> {info.id}</div>
                        <div><span className="font-medium">{t('place.items.teamId')}:</span> {info.teamId}</div>
                        <div><span className="font-medium">SKU:</span> {info.sku || '—'}</div>
                        <div><span className="font-medium">{t('place.items.categoryId')}:</span> {info.categoryId || '—'}</div>
                        <div><span className="font-medium">{t('place.items.unit')}:</span> {info.unit || (info.measurementType === 'WEIGHT' ? 'kg (saved as g)' : 'pcs')}</div>
                        <div><span className="font-medium">{t('place.items.price')}:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: place?.currency || 'EUR' }).format(info.price || 0)}</div>
                        <div><span className="font-medium">{t('place.items.tax')}:</span> {(info.taxRateBps / 100).toFixed(2)}%</div>
                        <div><span className="font-medium">{t('place.items.active')}:</span> {info.isActive ? tc('yes') : tc('no')}</div>
                        <div><span className="font-medium">{t('place.items.warehouseStock')}:</span> {(() => { const q = Number(info.stockQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return `${q} m (${q * 100} cm)`; if (info.measurementType === 'VOLUME') return `${q} l`; if (info.measurementType === 'AREA') return `${q} m2`; if (info.measurementType === 'TIME') return `${q} h (${q * 60} min)`; return q; })()}</div>
                        <div><span className="font-medium">{t('place.items.assignedHere')}:</span> {(() => { const q = Number(info.placeQuantity || 0); if (info.measurementType === 'WEIGHT') return q >= 1000 ? `${(q / 1000).toFixed(2)} kg` : `${q} g`; if (info.measurementType === 'LENGTH') return `${q} m (${q * 100} cm)`; if (info.measurementType === 'VOLUME') return `${q} l`; if (info.measurementType === 'AREA') return `${q} m2`; if (info.measurementType === 'TIME') return `${q} h (${q * 60} min)`; return q; })()}</div>
                        <div><span className="font-medium">{t('place.items.createdAt')}:</span> {new Date(info.createdAt).toLocaleString()}</div>
                        <div><span className="font-medium">{t('place.items.updatedAt')}:</span> {new Date(info.updatedAt).toLocaleString()}</div>
                    </div>
                ) : (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('place.items.errors.loadDetails')}</div>
                )}
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setInfoOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('close')}</button>
                </div>
            </Modal>
        </div >
    )
}
