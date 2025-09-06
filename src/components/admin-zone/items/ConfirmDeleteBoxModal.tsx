import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
    confirmBoxKey: string | null
    onClose: () => void
    onDeleted?: (groupKey: string) => void
    onConflict?: (info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'box' }) => void
}

export const ConfirmDeleteBoxModal = ({ confirmBoxKey, onClose, onDeleted, onConflict }: Props) => {
    const t = useTranslations('Items')
    const [deleting, setDeleting] = useState(false)
    const [msg, setMsg] = useState('')

    async function handleDelete() {
        if (!confirmBoxKey) return
        setDeleting(true); setMsg('')
        try {
            // groupKey format: `${teamId}|${baseLabel}|${color || ""}`
            const [teamId, baseLabel, color] = confirmBoxKey.split("|")
            let baseName = baseLabel
            if (color && baseLabel.endsWith(` (${color})`)) {
                baseName = baseLabel.slice(0, -(` (${color})`).length)
            }
            const res = await fetch(`/api/items/box`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, baseName, color: color || null }),
            })
            const data: unknown = await res.json().catch(() => ({}))
            if (res.status === 409) {
                const places = (typeof data === 'object' && data && Array.isArray((data as { places?: unknown }).places)
                    ? ((data as { places: { placeId: string; placeName: string; quantity: number }[] }).places)
                    : [])
                onConflict?.({ id: confirmBoxKey, places, kind: 'box' })
                toast(t('modals.conflict.boxAssigned'), { icon: '⚠️' })
                onClose()
                return
            }
            if (!res.ok) {
                const errMsg = (typeof data === 'object' && data && typeof (data as { error?: unknown }).error === 'string')
                    ? (data as { error: string }).error
                    : t('toasts.boxDeleteFailed')
                throw new Error(errMsg)
            }
            toast.success(t('toasts.boxDeleted'))
            onDeleted?.(confirmBoxKey)
            onClose()
        } catch (e) {
            setMsg((e as Error)?.message || t('toasts.boxDeleteFailed'))
            toast.error(t('toasts.boxDeleteFailed'))
        } finally { setDeleting(false) }
    }

    return (
        <>
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-500/10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div className="mt-3 text-left sm:ml-4 sm:mt-0">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{t('modals.deleteBox.title')}</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('modals.deleteBox.body')}</p>
                </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 sm:ml-3 sm:w-auto dark:bg-red-500 dark:hover:bg-red-400"
                >
                    {deleting ? t('modals.deleteBox.deleting') : t('modals.deleteBox.submit')}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600"
                >
                    {t('modals.deleteBox.cancel')}
                </button>
            </div>
            {msg && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{msg}</p>}
        </>
    )
}
