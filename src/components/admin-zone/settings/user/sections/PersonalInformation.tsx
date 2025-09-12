'use client'

import React from 'react'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import ImageUploader from '@/components/ui/ImageUploader'
import { useTranslations } from 'next-intl'

type Props = {
    firstName: string
    lastName: string
}

export const PersonalInformation: React.FC<Props> = ({ firstName, lastName }) => {
    const t = useTranslations('Settings.personal')
    const tc = useTranslations('Common')
    const [first, setFirst] = React.useState(firstName)
    const [last, setLast] = React.useState(lastName)
    const [saving, setSaving] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
    const [uploading, setUploading] = React.useState(false)
    const [removing, setRemoving] = React.useState(false)
    const [file, setFile] = React.useState<File | null>(null)

    React.useEffect(() => {
        setFirst(firstName)
    }, [firstName])
    React.useEffect(() => {
        setLast(lastName)
    }, [lastName])

    React.useEffect(() => {
        let cancelled = false
        async function loadAvatar() {
            try {
                const res = await fetch('/api/users/me', { credentials: 'include' })
                const data = await res.json().catch(() => ({}))
                if (!cancelled) setAvatarUrl(data?.avatarUrl ?? null)
            } catch { }
        }
        loadAvatar()
        return () => { cancelled = true }
    }, [])

    // When a file is selected in the ImageUploader, upload it immediately
    React.useEffect(() => {
        async function uploadSelected(f: File) {
            try {
                if (f.size > 5_000_000) {
                    toast.error(t('toasts.fileTooLarge'))
                    return
                }
                setUploading(true)
                const fd = new FormData()
                fd.append('file', f)
                const res = await fetch('/api/users/me/avatar/upload', { method: 'POST', body: fd, credentials: 'include' })
                const data = await res.json().catch(() => ({}))
                if (!res.ok) {
                    toast.error(data?.error || t('toasts.uploadFailed'))
                    return
                }
                setAvatarUrl(data?.avatarUrl ?? null)
                toast.success(t('toasts.avatarUpdated'))
            } catch {
                toast.error(t('toasts.uploadError'))
            } finally {
                setUploading(false)
                // Clear local file so the uploader shows the latest server image
                setFile(null)
            }
        }
        if (file) uploadSelected(file)
    }, [file, t])

    async function handleDeleteAvatar() {
        try {
            setRemoving(true)
            const res = await fetch('/api/users/me/avatar', { method: 'DELETE', credentials: 'include' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                toast.error(data?.error || t('toasts.removeFailed'))
                return
            }
            setAvatarUrl(null)
            toast.success(t('toasts.avatarRemoved'))
        } catch {
            toast.error(tc('errors.failed'))
        } finally {
            setRemoving(false)
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage(null)
        setSaving(true)
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ firstName: first, lastName: last }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const err = typeof data?.error === 'string' ? data.error : tc('errors.failedToSave')
                setMessage(err)
                toast.error(err)
                return
            }
            const msg = t('toasts.profileUpdated')
            setMessage(msg)
            toast.success(msg)
        } catch {
            setMessage(t('toasts.networkError'))
            toast.error(t('toasts.networkError'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>

            <form className="md:col-span-2" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full sm:max-w-md">
                        <ImageUploader
                            id="avatar"
                            label={t('avatarAlt')}
                            value={file}
                            onChange={setFile}
                            initialUrl={avatarUrl}
                            onRemoveInitial={handleDeleteAvatar}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            maxSizeMB={5}
                            disabled={uploading || removing}
                            replaceLabel={t('changeAvatar')}
                            removeLabel={tc('delete')}
                            hint={t('uploadNote')}
                            className=""
                        />
                        {(uploading || removing) && (
                            <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Spinner size={16} className={uploading ? 'text-gray-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400'} />
                                <span>{uploading ? t('uploading') : t('removing')}</span>
                            </div>
                        )}
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="first-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">{t('firstName')}</label>
                        <div className="mt-2">
                            <input
                                id="first-name"
                                name="first-name"
                                type="text"
                                autoComplete="given-name"
                                value={first}
                                onChange={(e) => setFirst(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">{t('lastName')}</label>
                        <div className="mt-2">
                            <input
                                id="last-name"
                                name="last-name"
                                type="text"
                                autoComplete="family-name"
                                value={last}
                                onChange={(e) => setLast(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <p className=" text-sm text-gray-500 dark:text-gray-400">{t('nameHint')}</p>
                    </div>




                </div>

                {message && (
                    <p className="mt-6 text-sm text-gray-700 dark:text-gray-300">{message}</p>
                )}

                <div className="mt-8 flex">
                    <button
                        type="submit"
                        disabled={saving}
                        aria-busy={saving}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {saving && <Spinner size={16} className="text-white" />}
                        <span>{saving ? tc('saving') : tc('save')}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
