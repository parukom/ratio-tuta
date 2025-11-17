import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api-client'

export const ChangePassword = () => {
    const t = useTranslations('Settings.password')
    const tc = useTranslations('Common')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setMessage(null)

        const cur = currentPassword.trim()
        const nw = newPassword.trim()
        const cf = confirmPassword.trim()

        if (!cur || !nw || !cf) {
            const msg = t('errors.fillAll')
            setMessage(msg)
            toast.error(msg)
            return
        }
        if (nw.length < 8 || nw.length > 128) {
            const msg = t('errors.length')
            setMessage(msg)
            toast.error(msg)
            return
        }
        if (nw !== cf) {
            const msg = t('errors.mismatch')
            setMessage(msg)
            toast.error(msg)
            return
        }

        try {
            setSubmitting(true)
            await api.patch('/api/users/me/password', {
                currentPassword: cur,
                newPassword: nw
            })
            setMessage(t('updated'))
            toast.success(t('updated'))
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            if (err instanceof ApiError) {
                // Check if it's a rate limit error (429)
                const errMsg = err.status === 429
                    ? t('errors.rateLimit')
                    : (err.message || t('errors.failed'))
                setMessage(errMsg)
                toast.error(errMsg)
            } else {
                setMessage(t('errors.failed'))
                toast.error(t('errors.failed'))
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
                {message && (
                    <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>
                )}
            </div>

            <form className="md:col-span-2" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
                    <div className="col-span-full">
                        <label
                            htmlFor="current-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            {t('current')}
                        </label>
                        <div className="mt-2">
                            <input
                                id="current-password"
                                name="current_password"
                                type="password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label
                            htmlFor="new-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            {t('new')}
                        </label>
                        <div className="mt-2">
                            <input
                                id="new-password"
                                name="new_password"
                                type="password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            {t('confirm')}
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirm-password"
                                name="confirm_password"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('hint')}</p>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-auto self-start rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {submitting ? tc('saving') : tc('save')}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('rateLimitWarning')}</p>
                </div>
            </form>
        </div>
    )
}
