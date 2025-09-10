'use client'
import Modal from "@/components/modals/Modal"
import Dropdown from "@/components/ui/Dropdown"
import Input from "@/components/ui/Input"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Spinner from "@/components/ui/Spinner"
import { useTranslations } from 'next-intl'
import ImageUploader from '@/components/ui/ImageUploader'

type ItemRow = {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    categoryName?: string | null
    price: number
    pricePaid?: number
    taxRateBps: number
    isActive: boolean
    unit?: string
    measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'
    stockQuantity?: number
    createdAt: string
    currency: string
    description?: string | null
    color?: string | null
    size?: string | null
    brand?: string | null
    tags?: string[] | null
    imageUrl?: string | null
}


export function ItemRowActions({ item, onItemUpdated, onItemDeleted, onConflict }: {
    item: ItemRow;
    onItemUpdated?: (updated: ItemRow, opts?: { categoryName?: string | null }) => void;
    onItemDeleted?: (id: string) => void;
    onConflict?: (info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' }) => void;
}) {
    const t = useTranslations('Common')
    const ti = useTranslations('Items')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const [name, setName] = useState(item.name)
    const [sku, setSku] = useState(item.sku ?? '')
    const [price, setPrice] = useState(String(item.price))
    const [taxRateBps, setTaxRateBps] = useState(String(item.taxRateBps))
    const [pricePaid, setPricePaid] = useState(String(item.pricePaid ?? 0))
    const [isActive, setIsActive] = useState(!!item.isActive)
    // derive initial measurement type (prefer field, fallback from unit)
    const mapUnitToMT = (u?: string): ItemRow['measurementType'] => {
        const m = (u || '').toLowerCase();
        if (['pcs', 'piece', 'pieces', 'unit', 'units'].includes(m)) return 'PCS'
        if (['kg', 'g', 'gram', 'grams', 'kilo'].includes(m)) return 'WEIGHT'
        if (['m', 'cm', 'mm', 'meter', 'metres'].includes(m)) return 'LENGTH'
        if (['l', 'ml', 'litre', 'liters'].includes(m)) return 'VOLUME'
        if (['m2', 'sqm', 'sq'].includes(m)) return 'AREA'
        if (['h', 'hr', 'hour', 'hours', 'min', 'minute', 's', 'sec', 'second'].includes(m)) return 'TIME'
        return 'PCS'
    }
    const [measurementType, setMeasurementType] = useState<ItemRow['measurementType']>(item.measurementType ?? mapUnitToMT(item.unit ?? 'pcs'))
    const [stockQuantity, setStockQuantity] = useState(String(item.stockQuantity ?? 0))
    // For WEIGHT items allow entering/editing in kg or g but save as grams
    const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>(() => {
        // heuristics: if existing quantity is large, assume grams; otherwise default to kg
        const q = Number(item.stockQuantity || 0)
        return q >= 1000 ? 'g' : 'kg'
    })
    const [description, setDescription] = useState(item.description ?? '')
    const [color, setColor] = useState(item.color ?? '')
    const [size, setSize] = useState(item.size ?? '')
    const [brand, setBrand] = useState(item.brand ?? '')
    const [tagsCSV, setTagsCSV] = useState((item.tags ?? []).join(', '))
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl ?? null)
    // categories state
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState<string | ''>(item.categoryId ?? '')
    const [creatingCat, setCreatingCat] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [catLoading, setCatLoading] = useState(false)
    const [catMsg, setCatMsg] = useState('')

    async function loadCategories() {
        try {
            const qs = new URLSearchParams()
            // Items page fetch is already scoped to user; teamId optional here
            qs.set('onlyActive', 'true')
            const r = await fetch(`/api/item-categories?${qs.toString()}`)
            if (!r.ok) return setCategories([])
            const data = (await r.json()) as Array<{ id: string; name: string }>
            setCategories(Array.isArray(data) ? data.map(c => ({ id: String(c.id), name: String(c.name) })) : [])
        } catch { setCategories([]) }
    }
    // load when opening
    useEffect(() => { if (open) loadCategories() }, [open])

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const nextCategoryId: string | null = categoryId ? categoryId : null
            const nextCategoryName: string | null = nextCategoryId ? (categories.find(c => c.id === nextCategoryId)?.name ?? null) : null
            // Perform update via API
            const res = await fetch(`/api/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    sku: sku.trim() || null,
                    price: Number(price),
                    pricePaid: Number(pricePaid) || 0,
                    taxRateBps: Number(taxRateBps) || 0,
                    isActive,
                    measurementType: (measurementType ?? 'PCS'),
                    stockQuantity: (() => {
                        const v = Number(stockQuantity)
                        if (!Number.isFinite(v) || v < 0) return 0
                        if (measurementType === 'WEIGHT') {
                            return Math.round((weightUnit === 'kg' ? v * 1000 : v))
                        }
                        return Math.round(v)
                    })(),
                    description: description.trim() || null,
                    color: color.trim() || null,
                    size: size.trim() || null,
                    brand: brand.trim() || null,
                    tags: tagsCSV.split(',').map(t => t.trim()).filter(Boolean),
                    categoryId: nextCategoryId,
                }),
            })
            if (!res.ok) throw new Error('Failed to update')
            const updated: ItemRow = await res.json()
            onItemUpdated?.({ ...item, ...updated, categoryName: nextCategoryName ?? null }, { categoryName: nextCategoryName })
            toast.success(ti('toasts.updated'))
            // If an image file is selected, upload it now
            if (imageFile) {
                try {
                    const fd = new FormData()
                    fd.append('file', imageFile)
                    const up = await fetch(`/api/items/${item.id}/image`, { method: 'POST', body: fd })
                    const upData = await up.json()
                    if (up.ok) {
                        setImageUrl(upData.imageUrl)
                        // notify parent with updated image
                        onItemUpdated?.({ ...item, ...updated, imageUrl: upData.imageUrl, categoryName: nextCategoryName ?? null }, { categoryName: nextCategoryName })
                    } else {
                        toast.error(upData.error || 'Failed to upload image')
                    }
                } catch {
                    toast.error('Failed to upload image')
                }
            }
            setMessage('Saved')
            setOpen(false)
        } catch {
            setMessage('Failed to save')
            toast.error('Failed to save')
        } finally {
            setLoading(false)
        }
    }

    const [confirmOpen, setConfirmOpen] = useState(false)
    async function doDelete() {
        setLoading(true)
        try {
            const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
            if (res.status === 409) {
                try {
                    const r2 = await fetch(`/api/items/${item.id}/places`)
                    const data = await r2.json()
                    const places = Array.isArray(data) ? data : []
                    onConflict?.({ id: item.id, places, kind: 'item' })
                } catch {
                    onConflict?.({ id: item.id, places: [], kind: 'item' })
                }
                toast(ti('modals.conflict.itemAssigned'), { icon: '⚠️' })
                setConfirmOpen(false)
                return
            }
            if (!res.ok) throw new Error('Failed to delete')
            onItemDeleted?.(item.id)
            toast.success(ti('toasts.deleted'))
            setConfirmOpen(false)
            setOpen(false)
        } catch {
            setMessage('Failed to delete')
            toast.error('Failed to delete')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(true)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('edit')}</button>
            <button onClick={() => setConfirmOpen(true)} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10">{t('delete')}</button>

            {/* Confirm deletion modal */}
            <Modal open={confirmOpen} onClose={() => (!loading && setConfirmOpen(false))} size="sm">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-500/10">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="mt-3 text-left sm:ml-4 sm:mt-0">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{ti('modals.deleteItem.title')}</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{ti('modals.deleteItem.confirm', { name: item.name })}</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={doDelete}
                        disabled={loading}
                        aria-busy={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 sm:ml-3 sm:w-auto dark:bg-red-500 dark:hover:bg-red-400"
                    >
                        {loading && <Spinner size={16} className="text-white" />}
                        <span>{loading ? t('deleting') : t('delete')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(false)}
                        disabled={loading}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </Modal>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-left sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{ti('modals.editItem.title')}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ti('modals.editItem.subtitle')}</p>
                    </div>
                </div>
                <form onSubmit={submit} className="mt-4 space-y-3">
                    <ImageUploader
                        id={`edit-image-${item.id}`}
                        label={ti('forms.picture')}
                        value={imageFile}
                        onChange={setImageFile}
                        hint={ti('forms.pictureHint')}
                        initialUrl={imageUrl || null}
                        onRemoveInitial={async () => {
                            try {
                                const r = await fetch(`/api/items/${item.id}/image`, { method: 'DELETE' })
                                if (r.ok) { setImageUrl(null); setImageFile(null); toast.success(ti('modals.image.removed')) }
                                else { const d = await r.json(); toast.error(d.error || ti('modals.image.removeFailed')) }
                            } catch { toast.error(ti('modals.image.removeFailed')) }
                        }}
                        allowCamera
                    />
                    <Input id={`name-${item.id}`} name="name" type="text" className="" placeholder={t('name')} value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                    <Input id={`sku-${item.id}`} name="sku" type="text" className="" placeholder={ti('forms.sku')} value={sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)} />
                    {/* Category selector with inline create */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ti('forms.category')}</label>
                        <div className="inline-block">
                            <Dropdown
                                align="left"
                                buttonLabel={([
                                    { key: 'NONE', label: ti('forms.noCategory') },
                                    ...categories.map(c => ({ key: c.id, label: c.name }))
                                ] as Array<{ key: string; label: string }>).find(o => o.key === (categoryId || 'NONE'))?.label || ti('forms.noCategory')}
                                items={[{ key: '', label: ti('forms.noCategory') }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                onSelect={(key) => setCategoryId(key)}
                            />
                        </div>
                        {!creatingCat ? (
                            <div className="mt-2">
                                <button type="button" onClick={() => { setCreatingCat(true); setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ {t('createNewCategory')}</button>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2">
                                <Input id={`newCategory-${item.id}`} name="newCategory" type="text" className="" placeholder={ti('forms.newCategoryName')} value={newCatName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)} />
                                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('cancel')}</button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!newCatName.trim()) { setCatMsg(ti('forms.enterName')); return }
                                        setCatLoading(true); setCatMsg('')
                                        try {
                                            const r = await fetch('/api/item-categories', {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() })
                                            })
                                            const data = await r.json()
                                            if (!r.ok) { setCatMsg(data.error || t('errors.failed')); return }
                                            setCategories(prev => { const next = [...prev, { id: data.id, name: data.name }]; next.sort((a, b) => a.name.localeCompare(b.name)); return next })
                                            setCategoryId(data.id)
                                            setCreatingCat(false)
                                            setNewCatName('')
                                        } catch { setCatMsg(ti('toasts.networkError')) } finally { setCatLoading(false) }
                                    }}
                                    disabled={catLoading}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                >
                                    {catLoading ? t('saving') : t('create')}
                                </button>
                            </div>
                        )}
                        {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id={`price-${item.id}`} name="price" type="number" className="" placeholder={ti('labels.price')} value={price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)} />
                        <Input id={`pricePaid-${item.id}`} name="pricePaid" type="number" className="" placeholder={ti('labels.cost')} value={pricePaid} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPricePaid(e.target.value)} />
                        <Input id={`tax-${item.id}`} name="tax" type="number" className="" placeholder={`${ti('labels.tax')} (bps)`} value={taxRateBps} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRateBps(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ti('forms.measurementType')}</label>
                            <div className="inline-block">
                                <Dropdown
                                    align="left"
                                    buttonLabel={([
                                        { key: 'PCS', label: ti('forms.measurementOptions.PCS') },
                                        { key: 'WEIGHT', label: ti('forms.measurementOptions.WEIGHT') },
                                        { key: 'LENGTH', label: ti('forms.measurementOptions.LENGTH') },
                                        { key: 'VOLUME', label: ti('forms.measurementOptions.VOLUME') },
                                        { key: 'AREA', label: ti('forms.measurementOptions.AREA') },
                                        { key: 'TIME', label: ti('forms.measurementOptions.TIME') },
                                    ] as Array<{ key: ItemRow['measurementType']; label: string }>).find(o => o.key === measurementType)?.label || ti('forms.select')}
                                    items={[
                                        { key: 'PCS', label: ti('forms.measurementOptions.PCS') },
                                        { key: 'WEIGHT', label: ti('forms.measurementOptions.WEIGHT') },
                                        { key: 'LENGTH', label: ti('forms.measurementOptions.LENGTH') },
                                        { key: 'VOLUME', label: ti('forms.measurementOptions.VOLUME') },
                                        { key: 'AREA', label: ti('forms.measurementOptions.AREA') },
                                        { key: 'TIME', label: ti('forms.measurementOptions.TIME') },
                                    ]}
                                    onSelect={(key) => { setMeasurementType(key as ItemRow['measurementType']); if (key !== 'WEIGHT') setWeightUnit('kg') }}
                                />
                            </div>
                        </div>
                        <div>
                            {measurementType === 'WEIGHT' && (
                                <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                    <button type="button" onClick={() => setWeightUnit('kg')} className={`px-2 py-1 text-xs ${weightUnit === 'kg' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>kg</button>
                                    <button type="button" onClick={() => setWeightUnit('g')} className={`px-2 py-1 text-xs ${weightUnit === 'g' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>g</button>
                                </div>
                            )}
                            <Input
                                id={`stock-${item.id}`}
                                name="stock"
                                type="number"
                                className=""
                                placeholder={
                                    measurementType === 'PCS' ? ti('forms.stock.PCS')
                                        : measurementType === 'WEIGHT' ? `${ti('forms.stock.WEIGHT')}`.replace('(kg)', `(${weightUnit})`)
                                            : measurementType === 'LENGTH' ? ti('forms.stock.LENGTH')
                                                : measurementType === 'VOLUME' ? ti('forms.stock.VOLUME')
                                                    : measurementType === 'AREA' ? ti('forms.stock.AREA')
                                                        : ti('forms.stock.TIME')
                                }
                                value={stockQuantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockQuantity(e.target.value)}
                            />
                            {measurementType === 'WEIGHT' && stockQuantity && Number(stockQuantity) > 0 && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {weightUnit === 'kg' ? `${Math.round(Number(stockQuantity) * 1000)} g will be saved` : `${(Number(stockQuantity) / 1000).toFixed(3)} kg`}
                                </p>
                            )}
                        </div>
                    </div>
                    <Input id={`desc-${item.id}`} name="description" type="text" className="" placeholder={ti('forms.descriptionOptional')} value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id={`color-${item.id}`} name="color" type="text" className="" placeholder={ti('forms.colorOptional')} value={color} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)} />
                        <Input id={`size-${item.id}`} name="size" type="text" className="" placeholder={ti('forms.sizeOptional')} value={size} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSize(e.target.value)} />
                        <Input id={`brand-${item.id}`} name="brand" type="text" className="" placeholder={ti('forms.brandOptional')} value={brand} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)} />
                    </div>
                    <Input id={`tags-${item.id}`} name="tags" type="text" className="" placeholder={ti('forms.tagsComma')} value={tagsCSV} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsCSV(e.target.value)} />
                    {/* Image block replaced by ImageUploader above */}
                    <div className="flex items-center gap-2">
                        <input id={`active-${item.id}`} name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
                        <label htmlFor={`active-${item.id}`} className="text-sm text-gray-700 dark:text-gray-300">{ti('forms.active')}</label>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{ti('forms.uniqueNote')}</div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{t('cancel')}</button>
                            <button type="submit" disabled={loading} aria-busy={loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading && <Spinner size={16} className="text-white" />}<span>{loading ? t('saving') : t('save')}</span></button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </div>
    )
}
