'use client'
import { useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'

type Props = {
    teamId?: string
    onCreated?: (place: { id: string; name: string }) => void
}

export default function CreatePlaceButton({ teamId, onCreated }: Props) {
    const t = useTranslations('Common')
    const th = useTranslations('Home')
    const locale = useLocale()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [limitModal, setLimitModal] = useState(false)
    const [limitInfo, setLimitInfo] = useState<null | { allowed: boolean; remaining: number | null; max: number | null }>(null)
    const [limitsLoading, setLimitsLoading] = useState(false)
    const [message, setMessage] = useState('')

    // form fields
    const [name, setName] = useState('')
    const [placeTypeId, setPlaceTypeId] = useState<string | undefined>(undefined)
    const [description, setDescription] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('')
    const [timezone, setTimezone] = useState('')
    const [currency, setCurrency] = useState('EUR')
    const [isActive, setIsActive] = useState(true)

    function reset() {
        setName(''); setPlaceTypeId(undefined); setDescription(''); setAddress1(''); setAddress2(''); setCity(''); setCountry(''); setTimezone(''); setCurrency('EUR'); setIsActive(true);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            if (!name.trim()) {
                const msg = th('place.create.messages.nameRequired')
                setMessage(msg)
                toast(msg, { icon: '⚠️' })
                setLoading(false)
                return
            }
            const data = await api.post<{ id: string; name: string }>('/api/places', {
                teamId, name, placeTypeId, description, address1, address2, city, country, timezone, currency, isActive
            })
            const okMsg = th('place.create.messages.created')
            setMessage(okMsg)
            toast.success(okMsg)
            onCreated?.(data)
            // notify sidebar/layout to refresh places list
            try { window.dispatchEvent(new Event('places:changed')) } catch { /* noop */ }
            reset()
            setOpen(false)
        } catch (err) {
            if (err instanceof ApiError) {
                // Detect server-side limit enforcement 403
                if (err.status === 403 && err.message.toLowerCase().includes('limit')) {
                    setOpen(false)
                    // attempt to load fresh limit info for modal
                    if (teamId) {
                        try {
                            const li = await api.get<{ allowed: boolean; remaining: number | null; max: number | null }>(`/api/teams/${teamId}/limits/places`)
                            setLimitInfo(li)
                        } catch { /* ignore */ }
                    }
                    setLimitModal(true)
                    toast.error(th('place.limit.title', { default: 'Plan limit reached' }))
                    return
                }
                const errMsg = err.message || th('place.create.messages.failedCreate')
                setMessage(errMsg)
                toast.error(errMsg)
            } else {
                const errMsg = th('place.create.messages.networkError')
                setMessage(errMsg)
                toast.error(errMsg)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={async () => {
                    if (!teamId) { // if no explicit teamId just open (server will validate)
                        setOpen(true); return
                    }
                    setLimitsLoading(true)
                    try {
                        const data = await api.get<{ allowed: boolean; remaining: number | null; max: number | null }>(`/api/teams/${teamId}/limits/places`)
                        setLimitInfo(data)
                        if (!data.allowed) { setLimitModal(true); return }
                        setOpen(true)
                    } catch { setOpen(true) } finally { setLimitsLoading(false) }
                }}
                className="inline-flex text-nowrap items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                disabled={limitsLoading}
            >
                {limitsLoading && <Spinner size={14} className="text-white mr-1" />} {t('createPlace')}
            </button>

            <Modal open={limitModal} onClose={() => setLimitModal(false)}>
                <div className="space-y-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3Z" /></svg>
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{th('place.limit.title', { default: 'Plan limit reached' })}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {limitInfo?.max != null ? (
                                    th('place.limit.body', { max: limitInfo.max, default: `You have reached the maximum of ${limitInfo.max} places allowed on your current plan.` })
                                ) : th('place.limit.bodyUnlimited', { default: 'You have reached a limit.' })}
                            </p>
                            {limitInfo?.max != null && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <span>{th('place.limit.usageLabel', { default: 'Usage' })}</span>
                                        <span>{Math.max(limitInfo.max - (limitInfo.remaining ?? 0), 0)}/{limitInfo.max}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                        <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all" style={{ width: `${Math.min(100, ((limitInfo.max - (limitInfo.remaining ?? 0)) / limitInfo.max) * 100)}%` }} />
                                    </div>
                                    {limitInfo.remaining === 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">{th('place.limit.reachedHint', { default: 'You have used all available places for this plan.' })}</p>
                                    )}
                                </div>
                            )}
                            <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400 list-disc pl-5">
                                <li>{th('place.limit.benefitMorePlaces', { default: 'Add more places to separate sales and reports.' })}</li>
                                <li>{th('place.limit.benefitTeam', { default: 'Higher plans unlock more teammates and items.' })}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button onClick={() => setLimitModal(false)} className="inline-flex justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('close', { default: 'Close' })}</button>
                        <Link href={`/${locale}/pricing`} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                            {th('place.limit.upgradeCta', { default: 'Upgrade plan' })}
                        </Link>
                    </div>
                </div>
            </Modal>

            <Modal open={open} onClose={() => setOpen(false)}>
                <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-left sm:mt-0 sm:text-left w-full">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{t('createPlace')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{th('place.create.subtitle')}</p>
                        <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>{th('place.create.helpTitle')}</strong> {th('place.create.helpText')}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="mt-4 space-y-3">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {th('place.form.nameLabel')} <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                        <Input id="name" name="name" type="text" className="" placeholder={th('place.form.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-4">
                        {th('place.form.optionalFieldsNote')}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="address1" name="address1" type="text" className="" placeholder={th('place.form.address1Optional')} value={address1} onChange={(e) => setAddress1(e.target.value)} />
                        <Input id="address2" name="address2" type="text" className="" placeholder={th('place.form.address2Optional')} value={address2} onChange={(e) => setAddress2(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="city" name="city" type="text" className="" placeholder={th('place.form.cityOptional')} value={city} onChange={(e) => setCity(e.target.value)} />
                        <Input id="country" name="country" type="text" className="" placeholder={th('place.form.countryOptional')} value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="timezone" name="timezone" type="text" className="" placeholder={th('place.form.timezoneOptional')} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                        <Input id="currency" name="currency" type="text" className="" placeholder={th('place.form.currencyOptional')} value={currency} onChange={(e) => setCurrency(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
                        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">{th('place.form.active')}</label>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{th('place.create.uniqueNote')}</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('cancel')}</button>
                            <button type="submit" disabled={loading} aria-busy={loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading && <Spinner size={16} className="text-white" />}<span>{loading ? t('creating') : t('create')}</span></button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </>
    )
}
