import React, { useState } from 'react'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

export const LogoutOtherSessions = () => {
    const t = useTranslations('Settings.logoutOthers')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        try {
            const res = await fetch('/api/logout-others', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const err = data?.error || t('errors.failed')
                setMessage(err)
                toast.error(err)
            } else {
                setMessage(t('success'))
                toast.success(t('success'))
                setPassword('')
            }
        } catch {
            setMessage(t('errors.network'))
            toast.error(t('errors.network'))
        } finally {
            setLoading(false)
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
                    <div className="col-span-full">
                        <label
                            htmlFor="logout-password"
                            className="block text-sm/6 font-medium text-gray-900 dark:text-white"
                        >
                            {t('label')}
                        </label>
                        <div className="mt-2">
                            <input
                                id="logout-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex">
                    <button
                        type="submit"
                        disabled={loading || !password}
                        aria-busy={loading}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {loading && <Spinner size={16} className="text-white" />}
                        <span>{loading ? t('processing') : t('action')}</span>
                    </button>
                </div>

                {message && (<p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>)}
            </form>
        </div>
    )
}
