import React, { useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api-client'

export const DeleteAccount = () => {
    const t = useTranslations('Settings.delete')
    const tc = useTranslations('Common')
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const phrase = useMemo(() => t('confirmPhrase'), [t])
    const [typed, setTyped] = useState('')
    const disabled = submitting || typed.trim() !== phrase

    async function confirmDelete() {
        setMessage(null)
        try {
            setSubmitting(true)
            // CSRF token automatically included via api.delete()
            await api.delete('/api/users/me')
            setMessage(t('success'))
            setOpen(false)
            setTimeout(() => { window.location.href = '/' }, 1000)
        } catch (err) {
            if (err instanceof ApiError) {
                setMessage(err.message || t('errors.failed'))
            } else {
                setMessage(t('errors.failed'))
            }
        } finally {
            setSubmitting(false)
        }
    }

    async function copyPhrase() {
        try {
            await navigator.clipboard.writeText(phrase)
            setMessage(t('copied'))
        } catch {
            setMessage(t('copyFailed'))
        }
    }
    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
                {message && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>}
            </div>

            <div className="flex items-start md:col-span-2">
                <button
                    type="button"
                    onClick={() => { setMessage(null); setTyped(''); setOpen(true) }}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400"
                >
                    {t('cta')}
                </button>

                <Modal open={open} onClose={() => { if (!submitting) { setOpen(false); setTyped('') } }} size="md">
                    <div className="text-left">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('confirmTitle')}</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('confirmBody')}</p>

                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('confirmLabel')}</label>
                            <div className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={phrase}
                                    className="flex-1 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-1 -outline-offset-1 outline-gray-200 dark:bg-white/5 dark:text-gray-200 dark:outline-white/10"
                                />
                                <button
                                    type="button"
                                    onClick={copyPhrase}
                                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                                    title={t('copyTitle')}
                                >
                                    <DocumentDuplicateIcon className="h-4 w-4" /> {t('copyBtn')}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-900 dark:text-white">{t('typeToProceed')}</label>
                            <input
                                id="confirm-delete"
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                autoFocus
                                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-red-500"
                                placeholder={phrase}
                            />
                            {typed && typed.trim() !== phrase && (
                                <p className="mt-1 text-xs text-red-600">{t('mismatch')}</p>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { if (!submitting) { setOpen(false); setTyped('') } }}
                                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                            >
                                {tc('cancel')}
                            </button>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={confirmDelete}
                                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:opacity-60 dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400"
                            >
                                {submitting ? tc('deleting') : t('cta')}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
