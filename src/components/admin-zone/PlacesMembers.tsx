import React, { useEffect, useState } from 'react'
import Dropdown from '../ui/Dropdown'
import { Member } from './places/types'
import { useTranslations } from 'next-intl'
import Modal from '@/components/modals/Modal'

type Props = {
    placeId: string
    onCountChange?: (count: number) => void
}

export const PlacesMembers = ({ placeId, onCountChange }: Props) => {
    const t = useTranslations('Home')
    const tc = useTranslations('Common')
    const [members, setMembers] = useState<Member[]>([])
    const [membersLoading, setMembersLoading] = useState(true)
    const [membersError, setMembersError] = useState<string | null>(null)
    const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])
    const [teamMembersLoading, setTeamMembersLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [removeOpen, setRemoveOpen] = useState(false)
    const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
    const [removeLoading, setRemoveLoading] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setMembersLoading(true)
        setMembersError(null)
        fetch(`/api/places/${placeId}/members`, { credentials: 'include' })
            .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.json().catch(() => ({ error: 'Failed' })))))
            .then((data: Member[]) => { if (!cancelled) { setMembers(data) } })
            .catch((e: unknown) => {
                const err = e as { error?: string } | string;
                if (!cancelled) setMembersError(typeof err === 'string' ? err : (typeof err?.error === 'string' ? err.error : 'Failed to load members'))
            })
            .finally(() => { if (!cancelled) setMembersLoading(false) })
        return () => { cancelled = true }
    }, [placeId, onCountChange])

    // Notify parent when the count changes, outside of render/state updaters
    useEffect(() => {
        onCountChange?.(members.length)
    }, [members.length, onCountChange])

    useEffect(() => {
        let cancelled = false
        setTeamMembersLoading(true)
        // fetch place to get teamId
        fetch(`/api/places/${placeId}`)
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Failed'))))
            .then((pl: { teamId: string }) => pl?.teamId)
            .then((teamId) => teamId ? fetch(`/api/teams/${teamId}/members`, { credentials: 'include' }) : Promise.reject('no-team'))
            .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(d?.error || 'Failed'))))
            .then((rows: Array<{ userId: string; name: string }>) => { if (!cancelled) setTeamMembers(rows) })
            .catch(() => { if (!cancelled) setTeamMembers([]) })
            .finally(() => { if (!cancelled) setTeamMembersLoading(false) })
        return () => { cancelled = true }
    }, [placeId])

    async function addMemberByUserId(userId: string) {
        if (!userId) return
        setSubmitting(true)
        setMembersError(null)
        try {
            const res = await fetch(`/api/places/${placeId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId }) })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to add')
            const list = await fetch(`/api/places/${placeId}/members`, { credentials: 'include' })
            if (list.ok) {
                const updated = await list.json()
                setMembers(updated)
            }
        } catch (e: unknown) {
            const err = e as { message?: string };
            setMembersError(err?.message || 'Failed to add')
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmRemoveMember() {
        if (!removeTarget) return
        setRemoveLoading(true)
        setRemoveError(null)
        try {
            const res = await fetch(`/api/places/${placeId}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId: removeTarget.userId }) })
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

    return (
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
        </div>
    )
}
