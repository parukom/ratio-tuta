'use client'
import React, { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import AddItemsToPlaceModal from '@/components/admin-zone/places/AddItemsToPlaceModal'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/modals/Modal'
import Dropdown from '@/components/ui/Dropdown'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import Tabs from '@/components/ui/Tabs'

type Member = { id: string; userId: string; name: string; email: string; createdAt: string }

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

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

export default function PlaceDetailPage() {
    const params = useParams<{ placeId: string }>()
    const placeId = params?.placeId
    const searchParams = useSearchParams()
    const router = useRouter()
    const tab = (searchParams.get('tab') ?? 'overview') as 'overview' | 'items' | 'members'
    const setTab = (t: 'overview' | 'items' | 'members') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('tab', t)
        router.push(`?${params.toString()}`)
    }
    const [place, setPlace] = useState<Place | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false)
    const [assignedItems, setAssignedItems] = useState<Array<{ id: string; itemId: string; quantity: number; item?: { id: string; name: string; sku?: string | null; price: number } }>>([])
    const [assignedLoading, setAssignedLoading] = useState(true)
    const [assignedError, setAssignedError] = useState<string | null>(null)
    // Members state
    const [members, setMembers] = useState<Member[]>([])
    const [membersLoading, setMembersLoading] = useState(true)
    const [membersError, setMembersError] = useState<string | null>(null)
    const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string; email: string }>>([])
    const [teamMembersLoading, setTeamMembersLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

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
                    // persist to localStorage for next visits
                    try {
                        localStorage.setItem(`place:${placeId}`, JSON.stringify(data))
                    } catch {
                        // ignore storage errors (e.g., quota)
                    }
                }
            })
            .catch((e) => {
                if (!cancelled) setError(typeof e === 'string' ? e : 'Failed to load place')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [placeId])
    async function removeFromShop(itemId: string) {
        if (!placeId) return
        const res = await fetch(`/api/places/${placeId}/items`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId }),
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            alert(data?.error || 'Failed to remove')
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
            if (!res.ok) throw new Error('Failed to load')
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
    }, [placeId])

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
    }, [placeId])

    // Load team members for this place's team (when place is known)
    useEffect(() => {
        if (!place?.teamId) return
        let cancelled = false
        setTeamMembersLoading(true)
        fetch(`/api/teams/${place.teamId}/members`, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Failed'))))
            .then((rows: Array<{ userId: string; name: string; email: string }>) => {
                if (cancelled) return
                setTeamMembers(rows.map(r => ({ userId: r.userId, name: r.name, email: r.email })))
            })
            .catch(() => { if (!cancelled) setTeamMembers([]) })
            .finally(() => { if (!cancelled) setTeamMembersLoading(false) })
        return () => { cancelled = true }
    }, [place?.teamId])

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

    async function removeMember(userId: string) {
        if (!confirm('Remove this member from the place?')) return
        try {
            const res = await fetch(`/api/places/${placeId}/members`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId })
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.error || 'Failed to remove')
            }
            setMembers((prev) => prev.filter((m) => m.userId !== userId))
        } catch (e: unknown) {
            const err = e as { message?: string };
            alert(err?.message || 'Failed to remove')
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
    <AdminLayout>
            <div>
                <header>
                   
                    {/* Heading */}
                    <div className="-mt-3 flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-2 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:bg-gray-700/10">
                        <div>
                            <div className="flex items-center gap-x-3">
                                <div className={`flex-none rounded-full p-1 ${place?.isActive ? 'bg-green-500/10 text-green-500 dark:bg-green-400/10 dark:text-green-400' : 'bg-gray-400/10 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400'}`}>
                                    <div className="size-2 rounded-full bg-current" />
                                </div>
                                <h1 className="flex flex-wrap items-center gap-x-3 text-base/7">
                                    <span className="font-semibold text-gray-900 dark:text-white">{place?.name || 'Place'}</span>
                                    <span className="text-gray-400 dark:text-gray-600">/</span>
                                    <button onClick={copyPlaceId} className="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
                                        #{placeId}{copied ? ' · Copied' : ''}
                                    </button>
                                </h1>
                            </div>
                            <p className="mt-2 text-xs/6 text-gray-500 dark:text-gray-400">{place?.description || 'Overview and stats'}</p>
                        </div>
                        <div className={`order-first flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset sm:order-0 ${place?.isActive ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/30' : 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-600/10 dark:text-gray-400 dark:ring-gray-500/30'}`}>
                            {place?.isActive ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                     <div className="px-4 pt-4 sm:px-6 lg:px-8">
                        <Breadcrumbs
                            items={[
                                { name: 'Places', href: '/dashboard/home?tab=places' },
                                { name: place?.name || 'Place' },
                            ]}
                        />
                    </div>

                    {/* Tabs */}
                    <Tabs
                        items={[
                            { key: 'overview', label: 'Overview' },
                            { key: 'items', label: `Items${assignedItems.length ? ` (${assignedItems.length})` : ''}` },
                            { key: 'members', label: `Members${members.length ? ` (${members.length})` : ''}` },
                        ]}
                        activeKey={tab}
                        onChange={(k) => setTab(k as typeof tab)}
                    />

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
                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mb-4 flex items-center justify-end gap-3">
                        <Link
                            href={`/cash-register?placeId=${encodeURIComponent(String(placeId))}`}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-50 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                        >
                            Open register
                        </Link>
                        {tab === 'items' && (
                            <button
                                type="button"
                                onClick={() => setIsAddItemsOpen(true)}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Add items
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="h-32 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    ) : error ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tab === 'members' && (
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                                    <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Members</h2>
                                    <div className="mb-3 flex items-center gap-2">
                                        {(() => {
                                            const available = teamMembers.filter(tm => !members.some(m => m.userId === tm.userId))
                                            const label = teamMembersLoading ? 'Loading…' : available.length ? 'Add member' : 'No available members'
                                            return (
                                                <Dropdown
                                                    buttonLabel={label}
                                                    disabled={teamMembersLoading || submitting || available.length === 0}
                                                    align="left"
                                                    items={available.map(tm => ({ key: tm.userId, label: `${tm.name} · ${tm.email}`, onSelect: (key) => addMemberByUserId(key) }))}
                                                />
                                            )
                                        })()}
                                    </div>
                                    {membersError && <p className="mb-2 text-sm text-rose-600 dark:text-rose-400">{membersError}</p>}
                                    <div className="overflow-hidden rounded border border-gray-200 dark:border-white/10">
                                        {membersLoading ? (
                                            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Loading…</div>
                                        ) : members.length === 0 ? (
                                            <div className="p-4 text-sm text-gray-600 dark:text-gray-300">No members yet.</div>
                                        ) : (
                                            <ul className="divide-y divide-gray-200 dark:divide-white/10">
                                                {members.map((m) => (
                                                    <li key={m.id} className="flex items-center justify-between px-4 py-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{m.email}</div>
                                                        </div>
                                                        <button onClick={() => removeMember(m.userId)} className="text-sm text-rose-600 hover:underline dark:text-rose-400">Remove</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}
                            {tab === 'items' && (
                                <div className="rounded-lg border border-gray-200 dark:border-white/10">
                                    <div className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 dark:border-white/10 dark:text-white">Assigned items</div>
                                    <div className="p-4">
                                        {assignedLoading ? (
                                            <div className="h-20 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                                        ) : assignedError ? (
                                            <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{assignedError}</div>
                                        ) : assignedItems.length === 0 ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">No items assigned yet.</div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="text-xs text-gray-500 dark:text-gray-400">
                                                    <tr>
                                                        <th className="py-2">Name</th>
                                                        <th className="py-2">SKU</th>
                                                        <th className="py-2 text-right">Price</th>
                                                        <th className="py-2 text-right">Qty</th>
                                                        <th className="py-2 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {assignedItems.map((row) => (
                                                        <tr key={row.id}>
                                                            <td className="py-2 text-sm">
                                                                <button
                                                                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                                                    onClick={() => openInfo(row.itemId, row.quantity)}
                                                                >
                                                                    {row.item?.name ?? `#${row.itemId}`}
                                                                </button>
                                                            </td>
                                                            <td className="py-2 text-sm text-gray-500 dark:text-gray-400">{row.item?.sku ?? '—'}</td>
                                                            <td className="py-2 text-right text-sm text-gray-900 dark:text-white">
                                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: place?.currency || 'EUR' }).format(row.item?.price ?? 0)}
                                                            </td>
                                                            <td className="py-2 text-right text-sm text-gray-900 dark:text-white">{row.quantity}</td>
                                                            <td className="py-2 text-right text-sm">
                                                                <button onClick={() => removeFromShop(row.itemId)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Remove</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
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
                <Modal open={infoOpen} onClose={() => setInfoOpen(false)} size="md">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Item info</h3>
                    {infoLoading ? (
                        <div className="mt-3 h-16 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                    ) : info ? (
                        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <div><span className="font-medium">Name:</span> {info.name}</div>
                            <div><span className="font-medium">Item ID:</span> {info.id}</div>
                            <div><span className="font-medium">Team ID:</span> {info.teamId}</div>
                            <div><span className="font-medium">SKU:</span> {info.sku || '—'}</div>
                            <div><span className="font-medium">Category ID:</span> {info.categoryId || '—'}</div>
                            <div><span className="font-medium">Unit:</span> {info.unit || 'pcs'}</div>
                            <div><span className="font-medium">Price:</span> {new Intl.NumberFormat('en-US', { style: 'currency', currency: place?.currency || 'EUR' }).format(info.price || 0)}</div>
                            <div><span className="font-medium">Tax:</span> {(info.taxRateBps / 100).toFixed(2)}%</div>
                            <div><span className="font-medium">Active:</span> {info.isActive ? 'Yes' : 'No'}</div>
                            <div><span className="font-medium">Warehouse stock:</span> {info.stockQuantity}</div>
                            <div><span className="font-medium">Assigned to this place:</span> {info.placeQuantity}</div>
                            <div><span className="font-medium">Created at:</span> {new Date(info.createdAt).toLocaleString()}</div>
                            <div><span className="font-medium">Updated at:</span> {new Date(info.updatedAt).toLocaleString()}</div>
                        </div>
                    ) : (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">Failed to load item details.</div>
                    )}
                    <div className="mt-4 flex justify-end">
                        <button onClick={() => setInfoOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Close</button>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    )
}
