import React, { useEffect, useState } from 'react'
import Input from '../ui/Input'
import { useTranslations } from 'next-intl'
import Spinner from '../ui/Spinner'
import DeletePlaceButton from './places/DeletePlaceButton'
import { Place } from './places/types'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

type Props = {
    place: Place | null
    router: AppRouterInstance
    onSaved?: (place: Place) => void
}

export const PlaceSettings = ({ place, router, onSaved }: Props) => {

    const t = useTranslations('Home')
    const tc = useTranslations('Common')
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editAddress1, setEditAddress1] = useState('')
    const [editAddress2, setEditAddress2] = useState('')
    const [editCity, setEditCity] = useState('')
    const [editCountry, setEditCountry] = useState('')
    const [editTimezone, setEditTimezone] = useState('')
    const [editCurrency, setEditCurrency] = useState('')
    const [editActive, setEditActive] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveMessage, setSaveMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!place) return
        setEditName(place.name || '')
        setEditDescription(place.description || '')
        setEditAddress1(place.address1 || '')
        setEditAddress2(place.address2 || '')
        setEditCity(place.city || '')
        setEditCountry(place.country || '')
        setEditTimezone(place.timezone || '')
        setEditCurrency(place.currency || 'EUR')
        setEditActive(!!place.isActive)
    }, [place])

    async function saveSettings(e: React.FormEvent) {
        e.preventDefault()
        if (!place?.id) return
        setSaveLoading(true)
        setSaveMessage(null)
        try {
            const res = await fetch(`/api/places/${place.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim() || null,
                    address1: editAddress1.trim() || null,
                    address2: editAddress2.trim() || null,
                    city: editCity.trim() || null,
                    country: editCountry.trim() || null,
                    timezone: editTimezone.trim() || null,
                    currency: editCurrency.trim() || null,
                    isActive: !!editActive,
                })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || tc('errors.failedToSave'))
            onSaved?.(data)
            try { localStorage.setItem(`place:${place.id}`, JSON.stringify(data)) } catch { }
            setSaveMessage(tc('saved'))
            setTimeout(() => setSaveMessage(null), 1500)
        } catch (e: unknown) {
            const err = e as { message?: string }
            setSaveMessage(err?.message || tc('errors.failedToSave'))
        } finally {
            setSaveLoading(false)
        }
    }
    return (
        <>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{t('place.settings.general')}</h2>
                <form onSubmit={saveSettings} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="name" name="name" type="text" placeholder={t('place.form.name')} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        <Input id="description" name="description" type="text" placeholder={t('place.form.descriptionOptional')} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="address1" name="address1" type="text" placeholder={t('place.form.address1')} value={editAddress1} onChange={(e) => setEditAddress1(e.target.value)} />
                        <Input id="address2" name="address2" type="text" placeholder={t('place.form.address2')} value={editAddress2} onChange={(e) => setEditAddress2(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="city" name="city" type="text" placeholder={t('place.form.city')} value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                        <Input id="country" name="country" type="text" placeholder={t('place.form.country')} value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input id="timezone" name="timezone" type="text" placeholder={t('place.form.timezone')} value={editTimezone} onChange={(e) => setEditTimezone(e.target.value)} />
                        <Input id="currency" name="currency" type="text" placeholder={t('place.form.currency')} value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input id="isActive" name="isActive" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="size-4" />
                        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">{t('place.form.active')}</label>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        {saveMessage && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">{saveMessage}</span>
                        )}
                        <button type="submit" disabled={saveLoading} aria-busy={saveLoading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                            {saveLoading && <Spinner size={16} className="text-white" />}
                            <span>{saveLoading ? tc('saving') : t('place.actions.saveChanges')}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* danger zone */}
            <div className='divide-y divide-gray-200 dark:divide-white/10'>
                <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                    <h2 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">{t('place.settings.danger.title')}</h2>
                    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('place.settings.danger.note')}</p>
                    {place && (
                        <DeletePlaceButton
                            placeId={place.id}
                            placeName={place.name}
                            size="md"
                            onDeleted={() => {
                                // After deletion, go back to places list
                                router.push('/dashboard/home?tab=places')
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
