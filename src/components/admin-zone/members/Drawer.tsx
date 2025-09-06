'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslations } from 'next-intl'

export type Member = {
    id: string
    name: string
    email: string
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
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<Member['role']>('USER')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const canEdit = isAdmin && Boolean(member)

    useEffect(() => {
        if (member) {
            setName(member.name || '')
            setEmail(member.email || '')
            setRole(member.role)
        } else {
            setName('')
            setEmail('')
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
                        body: JSON.stringify({ name, email, role }),
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
        <Dialog open={open && canEdit} onClose={onClose} className="relative z-10">
            <div className="fixed inset-0" />
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                        <DialogPanel
                            transition
                            className="pointer-events-auto w-screen max-w-xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
                        >
                            <form onSubmit={onSubmit} className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl dark:bg-gray-800 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                                <div className="flex-1">
                                    {/* Header */}
                                    <div className="bg-gray-50 px-4 py-6 sm:px-6 dark:bg-gray-800/50">
                                        <div className="flex items-start justify-between space-x-3">
                                            <div className="space-y-1">
                                                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                                    {tt('drawer.title')}
                                                </DialogTitle>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {tt('drawer.subtitle')}
                                                </p>
                                            </div>
                                            <div className="flex h-7 items-center">
                                                <button
                                                    type="button"
                                                    onClick={onClose}
                                                    className="relative rounded-md text-gray-400 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:text-white dark:focus-visible:outline-indigo-500"
                                                >
                                                    <span className="absolute -inset-2.5" />
                                                    <span className="sr-only">{t('close')}</span>
                                                    <XMarkIcon aria-hidden="true" className="size-6" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Form fields */}
                                        <div className="space-y-6 py-6 sm:space-y-0 sm:divide-y sm:divide-gray-200 sm:py-0 dark:sm:divide-white/10">
                                            <div className="space-y-2 px-4 sm:px-6 sm:py-5">
                                                <Input id="name" name="name" type="text" value={name} placeholder={t('name')} onChange={(e) => setName(e.target.value)} />
                                            </div>

                                            <div className="space-y-2 px-4 sm:px-6 sm:py-5">
                                                <Input id="email" name="email" type="email" value={email} placeholder={tt('email')} onChange={(e) => setEmail(e.target.value)} />
                                            </div>

                                            <div className="space-y-2 px-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0 sm:px-6 sm:py-5">
                                                <div>
                                                    <label className="block text-sm/6 font-medium text-gray-900 sm:mt-1.5 dark:text-white">{tt('role.label')}</label>
                                                </div>
                                                <div className="sm:col-span-2">
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
                                            </div>

                                            {error && (
                                                <div className="px-4 sm:px-6">
                                                    <p className="text-sm text-red-600">{error}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 border-t border-gray-200 px-4 py-5 sm:px-6 dark:border-white/10">
                                        <div className="flex justify-end space-x-3">
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
                                    </div>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}
