'use client'
import { useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'

type Props = {
    teamId?: string
    onCreated?: (place: { id: string; name: string }) => void
}

export default function CreatePlaceButton({ teamId, onCreated }: Props) {
    const t = useTranslations('Common')
    const th = useTranslations('Home')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
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
            const res = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, name, placeTypeId, description, address1, address2, city, country, timezone, currency, isActive }),
            })
            const data = await res.json()
            if (!res.ok) { const err = data.error || th('place.create.messages.failedCreate'); setMessage(err); toast.error(err); return }
            const okMsg = th('place.create.messages.created')
            setMessage(okMsg)
            toast.success(okMsg)
            onCreated?.(data)
            // notify sidebar/layout to refresh places list
            try { window.dispatchEvent(new Event('places:changed')) } catch { /* noop */ }
            reset()
            setOpen(false)
        } catch {
            const err = th('place.create.messages.networkError')
            setMessage(err)
            toast.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
                {t('createPlace')}
            </button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-left sm:mt-0 sm:text-left w-full">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{t('createPlace')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{th('place.create.subtitle')}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="mt-4 space-y-3">
                    <Input id="name" name="name" type="text" className="" placeholder={th('place.form.name')} value={name} onChange={(e) => setName(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="address1" name="address1" type="text" className="" placeholder={th('place.form.address1')} value={address1} onChange={(e) => setAddress1(e.target.value)} />
                        <Input id="address2" name="address2" type="text" className="" placeholder={th('place.form.address2')} value={address2} onChange={(e) => setAddress2(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="city" name="city" type="text" className="" placeholder={th('place.form.city')} value={city} onChange={(e) => setCity(e.target.value)} />
                        <Input id="country" name="country" type="text" className="" placeholder={th('place.form.country')} value={country} onChange={(e) => setCountry(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="timezone" name="timezone" type="text" className="" placeholder={th('place.form.timezone')} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                        <Input id="currency" name="currency" type="text" className="" placeholder={th('place.form.currency')} value={currency} onChange={(e) => setCurrency(e.target.value)} />
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
