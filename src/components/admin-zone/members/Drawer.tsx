'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Dropdown from '@/components/ui/Dropdown'
import Drawer from '@/components/ui/Drawer'
import { useTranslations } from 'next-intl'

export type Member = {
    id: string
    name: string
    role: 'USER' | 'ADMIN'
}

type Props = {
    open: boolean
    onClose: () => void
    member: Member | null
    isAdmin: boolean
    onSaved?: (member: Member) => void
}

export default function MemberDrawer({ open, onClose, member, isAdmin, onSaved }: Props) {
    const t = useTranslations('Common')
    const tt = useTranslations('Team')
    const [name, setName] = useState('')
    const [role, setRole] = useState<Member['role']>('USER')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const canEdit = isAdmin && Boolean(member)

    useEffect(() => {
        if (member) {
            setName(member.name || '')
            setRole(member.role)
        } else {
            setName('')
            setRole('USER')
        }
        setError(null)
    }, [member, open])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!member || !isAdmin) return
        setSubmitting(true)
        setError(null)
        try {
            const data = await toast.promise(
                (async () => {
                    const res = await fetch(`/api/users/${member.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, role }),
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json?.error || tt('toasts.updateFailed'))
                    return json
                })(),
                {
                    loading: t('saving'),
                    success: (d: unknown) => (typeof d === 'object' && d && 'message' in d ? (d as { message?: string }).message || tt('toasts.userUpdated') : tt('toasts.userUpdated')),
                    error: (err: unknown) => (err instanceof Error ? err.message : tt('toasts.updateFailed')),
                },
            )
            const payload = data as { user: Member }
            onSaved?.(payload.user)
            onClose()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update user'
            setError(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Drawer open={open && canEdit} onClose={onClose} side="right" title={tt('drawer.title')} widthClassName="w-screen max-w-xl">
            <form onSubmit={onSubmit} className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">{tt('drawer.subtitle')}</p>

                <section className="space-y-2">
                    <Input id="name" name="name" type="text" value={name} placeholder={t('name')} onChange={(e) => setName(e.target.value)} />
                </section>

                <section className="grid grid-cols-3 gap-4 items-center">
                    <label className="block text-sm/6 font-medium text-gray-900 dark:text-white col-span-1">{tt('role.label')}</label>
                    <div className="col-span-2">
                        <Dropdown
                            buttonLabel={role === 'ADMIN' ? tt('roles.admin') : tt('roles.member')}
                            items={[
                                { key: 'USER', label: tt('roles.member') },
                                { key: 'ADMIN', label: tt('roles.admin') },
                            ]}
                            onSelect={(key) => setRole(key as 'USER' | 'ADMIN')}
                            align="left"
                        />
                    </div>
                </section>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        aria-busy={submitting}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {submitting && <Spinner size={16} className="text-white" />}
                        <span>{submitting ? t('saving') : tt('drawer.saveChanges')}</span>
                    </button>
                </div>
            </form>
        </Drawer>
    )
}
