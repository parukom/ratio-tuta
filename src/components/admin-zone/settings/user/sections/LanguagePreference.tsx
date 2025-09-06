'use client'

import React from 'react'
import Dropdown from '@/components/ui/Dropdown'
import { useTranslations } from 'next-intl'

type LangValue = 'device' | 'en' | 'lt' | 'ru'

export const LanguagePreference: React.FC = () => {
    const t = useTranslations('Settings.language')
    const [value, setValue] = React.useState<LangValue>('device')
    const [pending, setPending] = React.useState(false)
    const labels = React.useMemo(
        () => ({
            device: t('device'),
            en: t('en'),
            lt: t('lt'),
            ru: t('ru'),
        } as const),
        [t],
    )

    // Detect current selection from cookie; fallback to device
    React.useEffect(() => {
        try {
            const cookie = document.cookie
            const m = cookie.match(/(?:^|; )locale=([^;]+)/)
            const raw = m ? decodeURIComponent(m[1]) : null
            if (raw === 'en' || raw === 'lt' || raw === 'ru') setValue(raw)
            else setValue('device')
        } catch {
            setValue('device')
        }
    }, [])

    async function apply(next: LangValue) {
        setPending(true)
        try {
            await fetch('/api/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: next }),
                credentials: 'include',
            })
        } finally {
            // Reload to apply server-rendered messages
            window.location.reload()
        }
    }

    return (
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
            <div>
                <h2 className="text-base/7 font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
                <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">{t('label')}</label>
                <div className="mt-2 flex items-center gap-3">
                    <Dropdown
                        buttonLabel={labels[value]}
                        disabled={pending}
                        items={[
                            { key: 'device', label: labels.device, onSelect: () => setValue('device') },
                            { key: 'en', label: labels.en, onSelect: () => setValue('en') },
                            { key: 'lt', label: labels.lt, onSelect: () => setValue('lt') },
                            { key: 'ru', label: labels.ru, onSelect: () => setValue('ru') },
                        ]}
                        onSelect={(key) => setValue(key as LangValue)}
                        align="left"
                    />
                    <button
                        type="button"
                        onClick={() => apply(value)}
                        disabled={pending}
                        aria-busy={pending}
                        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                    >
                        {pending ? t('applying') : t('apply')}
                    </button>
                </div>
                <p className="mt-2 text-xs/5 text-gray-500 dark:text-gray-400">{t('note')}</p>
            </div>
        </div>
    )
}

export default LanguagePreference
