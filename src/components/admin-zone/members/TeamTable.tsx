'use client'

import Modal from '@/components/modals/Modal'
import React, { useEffect, useState } from 'react'
import AddMember from './InviteMemberForm'
import AdminHeader from '@/components/layout/AdminHeader'
import TableSkeleton from '@/components/ui/TableSkeleton'

type Person = { name: string; email: string; role: string }
type ApiUser = { id: string; name: string; email: string; role: 'USER' | 'ADMIN'; createdAt: string }
type ApiTeam = { id: string; name: string }
type Props = { teamId?: string }

const TeamTable = ({ teamId }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [teams, setTeams] = useState<ApiTeam[]>([])
    const [activeTeamId, setActiveTeamId] = useState<string | undefined>(teamId)

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
            setPeople((data as ApiUser[]).map((u) => ({ name: u.name, email: u.email, role: u.role === 'ADMIN' ? 'Admin' : 'Member' })))
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load team members'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTeams()
        loadUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId])

    return (
        <div className="mt-8 flow-root h-full">
            <AdminHeader
                title="Team Management"
                subtitle={activeTeamId ? 'A list of all the users in your team including their name, email and role.' : 'You are not part of any team yet.'}
                onAdd={() => setIsModalOpen(true)}
                addLabel="Invite member"
            />

            <div className={` h-full ${loading ? 'flex justify-center items-center' : ''}`}>
                {teams.length > 1 && (
                    <div className="mt-4">
                        <label htmlFor="team" className="block text-sm/6 font-medium text-gray-900 dark:text-white">Team</label>
                        <div className="mt-2">
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
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">No members yet.</p>
                )}
                {loading ? (
                    <div className="w-full -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
                            <TableSkeleton rows={8} columnWidths={["w-40", "w-64", "w-28", "w-10"]} />
                        </table>
                    </div>
                ) : (
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
                                <thead>
                                    <tr>
                                        <th
                                            scope="col"
                                            className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-white"
                                        >
                                            Name
                                        </th>

                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                            Role
                                        </th>
                                        <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                    {people.map((person) => (
                                        <tr key={person.email}>
                                            <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                                                {person.name}
                                            </td>

                                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {person.email}
                                            </td>
                                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {person.role}
                                            </td>
                                            <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                                                <a
                                                    href="#"
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    Edit<span className="sr-only">, {person.name}</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <AddMember teamId={activeTeamId} onSuccess={() => { setIsModalOpen(false); loadUsers() }} />
            </Modal>
        </div>
    )
}

export default TeamTable;
