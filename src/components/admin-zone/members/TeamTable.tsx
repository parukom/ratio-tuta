'use client'

import Modal from '@/components/modals/Modal'
import React, { useEffect, useState } from 'react'
import AddMember from './InviteMemberForm'
import MemberDrawer, { type Member } from './Drawer'
import AdminHeader from '@/components/layout/AdminHeader'
import { EllipsisVertical, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Spinner from '@/components/ui/Spinner'

type Person = { id: string; name: string; role: 'USER' | 'ADMIN' }
type ApiUser = { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; createdAt: string }
type ApiTeam = { id: string; name: string }
type Props = { teamId?: string }

const TeamTable = ({ teamId }: Props) => {
    const t = useTranslations('Common')
    const tt = useTranslations('Team')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [teams, setTeams] = useState<ApiTeam[]>([])
    const [activeTeamId, setActiveTeamId] = useState<string | undefined>(teamId)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selected, setSelected] = useState<Member | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [reveal, setReveal] = useState(false)
    const [q, setQ] = useState('')

    async function loadTeams() {
        try {
            const res = await fetch('/api/teams')
            const data: ApiTeam[] | { error: string } = await res.json()
            if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load teams')
            const ts = data as ApiTeam[]
            setTeams(ts)
            if (!activeTeamId && ts.length > 0) setActiveTeamId(ts[0].id)
        } catch {
            // best-effort; leave teams empty
        }
    }

    async function loadUsers(tid?: string) {
        setLoading(true)
        setError(null)
        try {
            const qs = new URLSearchParams()
            const target = tid ?? activeTeamId
            if (target) qs.set('teamId', String(target))
            qs.set('includeSelf', 'true')
            const res = await fetch(`/api/users?${qs.toString()}`)
            const data: ApiUser[] | { error: string } = await res.json()
            if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to load team members')
            setPeople((data as ApiUser[]).map((u) => ({ id: u.id, name: u.name, role: u.role })))
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load team members'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    async function loadMeRole() {
        try {
            const res = await fetch('/api/users/me')
            const me = (await res.json()) as { role?: 'USER' | 'ADMIN' }
            if (res.ok && me?.role) setIsAdmin(me.role === 'ADMIN')
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        loadTeams()
        loadUsers()
        loadMeRole()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId])

    // When loading finishes, fade in inner content smoothly
    useEffect(() => {
        if (!loading) {
            setReveal(false)
            const tm = setTimeout(() => setReveal(true), 50)
            return () => clearTimeout(tm)
        }
    }, [loading, people.length])

    return (
        <div className="mt-8 px-4 flow-root h-full">
            <AdminHeader
                left={
                    !loading ? (
                        <div className="relative w-full ">
                            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder={tt('searchPlaceholder')}
                                aria-label={t('search')}
                                className="block w-full rounded-md bg-white pl-9 pr-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    ) : undefined
                }
                right={
                    !loading ? (
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    aria-label={tt('inviteMember') ?? t('add')}
                                >
                                    {tt('inviteMember') ?? t('add')}
                                </button>
                            )}
                        </div>
                    ) : undefined
                }
            />

            <div className={` h-full ${loading ? 'flex justify-center items-center' : ''}`}>
                {/* Team select under header (if many teams) */}
                {!loading && teams.length > 1 && (
                    <div className="mt-4">
                        <div className="flex items-center gap-3">
                            <label htmlFor="team" className="text-sm font-medium text-gray-900 dark:text-white">{tt('teamLabel')}</label>
                            <select
                                id="team"
                                name="team"
                                value={activeTeamId}
                                onChange={(e) => { const tid = e.target.value; setActiveTeamId(tid); loadUsers(tid) }}
                                className="block w-full max-w-xs rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                            >
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                {!loading && !error && people.length === 0 && (
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{tt('noMembers')}</p>
                )}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner size={24} className="text-gray-400 dark:text-white/40" />
                    </div>
                ) : (
                    <div className="px-0 sm:px-0 lg:px-0 mt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {people
                                .filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()))
                                .map((person) => (
                                    <div key={person.id} className="relative rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className={`transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'} flex items-center gap-3`}>
                                                <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-1 ring-black/5 dark:bg:white/10 dark:text-gray-300 dark:ring-white/10">
                                                    {person.name.split(' ').map((s) => s.charAt(0)).slice(0, 2).join('')}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{person.name}</div>
                                                    <div className="mt-1 text-[11px]">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-inset ${person.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300' : 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10'}`}>
                                                            {person.role === 'ADMIN' ? tt('roles.admin') : tt('roles.member')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const m: Member = { id: person.id, name: person.name, role: person.role }
                                                        setSelected(m)
                                                        setDrawerOpen(true)
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    aria-label={`${t('edit')} ${person.name}`}
                                                >
                                                    <EllipsisVertical />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AddMember teamId={activeTeamId} onSuccess={() => { setIsModalOpen(false); loadUsers() }} />
            </Modal>

            <MemberDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                member={selected}
                isAdmin={isAdmin}
                onSaved={() => {
                    // refresh list and keep drawer closed
                    loadUsers()
                }}
            />
        </div>
    )
}

export default TeamTable;
