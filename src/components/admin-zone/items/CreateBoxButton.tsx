'use client'
import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'

// Stable localStorage keys
const LS_TAX = 'box:taxRateBps'
const LS_CATEGORY = 'box:categoryId'
const LS_MT = 'box:measurementType'
const LS_SIZES = 'box:sizes'

type SizeRow = { id: string; size: string; quantity: string; sku?: string }

type Props = {
    teamId?: string
    defaultCategoryId?: string | null
    onDone?: () => void
}

export default function CreateBoxButton({ teamId, defaultCategoryId, onDone }: Props) {
    const t = useTranslations('Items')
    const tc = useTranslations('Common')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const [baseName, setBaseName] = useState('')
    const [color, setColor] = useState('')
    const [price, setPrice] = useState('')
    const [boxCost, setBoxCost] = useState('')
    const [taxRateBps, setTaxRateBps] = useState('0')
    const [measurementType, setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'>('PCS')
    const [skuPrefix, setSkuPrefix] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    // categories
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    const [categoryId, setCategoryId] = useState<string | ''>(defaultCategoryId || '')
    const [creatingCat, setCreatingCat] = useState(false)
    const [newCatName, setNewCatName] = useState('')
    const [catLoading, setCatLoading] = useState(false)
    const [catMsg, setCatMsg] = useState('')
    // Safe ID generator that works in browser and during SSR/lint with fallback
    const genId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const [sizes, setSizes] = useState<SizeRow[]>([
        { id: genId(), size: '', quantity: '0' },
    ])
    // For measurement boxes allow per-row unit toggle
    const [weightUnits, setWeightUnits] = useState<Record<string, 'kg' | 'g'>>({})
    const [lengthUnits, setLengthUnits] = useState<Record<string, 'm' | 'cm'>>({})
    const [volumeUnits, setVolumeUnits] = useState<Record<string, 'l' | 'ml'>>({})
    const [areaUnits, setAreaUnits] = useState<Record<string, 'm²' | 'cm²'>>({})

    const loadCategories = useCallback(async () => {
        try {
            const qs = new URLSearchParams()
            if (teamId) qs.set('teamId', teamId)
            qs.set('onlyActive', 'true')
            const r = await fetch(`/api/item-categories?${qs.toString()}`)
            if (!r.ok) return setCategories([])
            const data = (await r.json()) as Array<{ id: string; name: string }>
            setCategories(Array.isArray(data) ? data.map((c) => ({ id: String(c.id), name: String(c.name) })) : [])
        } catch { setCategories([]) }
    }, [teamId])
    useEffect(() => { if (open) loadCategories() }, [open, loadCategories])

    // Load persisted values when opening modal
    useEffect(() => {
        if (!open) return
        try {
            const vTax = localStorage.getItem(LS_TAX)
            if (vTax != null) setTaxRateBps(vTax)

            const allowed = ['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA'] as const
            const vMT = localStorage.getItem(LS_MT) as typeof measurementType | null
            if (vMT && (allowed as readonly string[]).includes(vMT)) setMeasurementType(vMT)

            const vCat = localStorage.getItem(LS_CATEGORY)
            if (typeof vCat === 'string') setCategoryId(vCat)

            // sizes (persisted as array of { size, quantity, sku? })
            const raw = localStorage.getItem(LS_SIZES)
            if (raw) {
                try {
                    const arr = JSON.parse(raw) as Array<{ size: string; quantity: string | number; sku?: string }>
                    if (Array.isArray(arr) && arr.length) {
                        const mapped = arr.map((r) => ({ id: genId(), size: String(r.size ?? ''), quantity: String(r.quantity ?? '0'), sku: r.sku ? String(r.sku) : undefined }))
                        setSizes(mapped.length ? mapped : [{ id: genId(), size: '', quantity: '0' }])
                    }
                } catch { /* ignore parse */ }
            }
        } catch { /* ignore */ }
    }, [open])

    // Ensure stored category still exists after categories load
    useEffect(() => {
        if (!open) return
        if (categoryId && !categories.some(c => c.id === categoryId)) setCategoryId('')
    }, [open, categories, categoryId])

    // Persist on changes
    useEffect(() => { try { localStorage.setItem(LS_TAX, taxRateBps || '0') } catch { } }, [taxRateBps])
    useEffect(() => { try { localStorage.setItem(LS_CATEGORY, categoryId || '') } catch { } }, [categoryId])
    useEffect(() => { try { localStorage.setItem(LS_MT, measurementType) } catch { } }, [measurementType])

    function addRow() {
        const id = genId()
        setSizes(prev => [...prev, { id, size: '', quantity: '0' }])
        setWeightUnits(prev => ({ ...prev, [id]: 'kg' }))
        setLengthUnits(prev => ({ ...prev, [id]: 'm' }))
        setVolumeUnits(prev => ({ ...prev, [id]: 'l' }))
        setAreaUnits(prev => ({ ...prev, [id]: 'm²' }))
    }
    function removeRow(id: string) {
        setSizes(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
        // remove keys from unit maps
        setWeightUnits(prev => { const next = { ...prev }; delete next[id]; return next })
        setLengthUnits(prev => { const next = { ...prev }; delete next[id]; return next })
        setVolumeUnits(prev => { const next = { ...prev }; delete next[id]; return next })
        setAreaUnits(prev => { const next = { ...prev }; delete next[id]; return next })
    }
    function updateRow(id: string, patch: Partial<SizeRow>) {
        setSizes(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    }

    // Persist sizes into localStorage whenever they change (store only shape without ids)
    useEffect(() => {
        try {
            const compact = sizes
                .filter(s => (s.size?.trim() || s.quantity?.toString().trim()))
                .map(s => ({ size: s.size.trim(), quantity: String(s.quantity || '0'), ...(s.sku ? { sku: s.sku } : {}) }))
            if (compact.length) localStorage.setItem(LS_SIZES, JSON.stringify(compact))
            else localStorage.removeItem(LS_SIZES)
        } catch { /* ignore */ }
    }, [sizes])

    function resetSizes() {
        try { localStorage.removeItem(LS_SIZES) } catch { }
        const id = genId()
        setSizes([{ id, size: '', quantity: '0' }])
        setWeightUnits({ [id]: 'kg' })
        setLengthUnits({ [id]: 'm' })
        setVolumeUnits({ [id]: 'l' })
        setAreaUnits({ [id]: 'm²' })
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setMessage('')
        setLoading(true)
        try {
            const payload = {
                ...(teamId ? { teamId } : {}),
                baseName,
                color: color || null,
                categoryId: (categoryId || undefined),
                price: Number(price),
                boxCost: Number(boxCost) || 0,
                taxRateBps: Number(taxRateBps) || 0,
                measurementType,
                skuPrefix: skuPrefix || null,
                sizes: sizes
                    .filter(s => s.size.trim() && Number(s.quantity) > 0)
                    .map(s => ({
                        size: s.size.trim(),
                        quantity: (() => {
                            const v = Number(s.quantity)
                            if (!Number.isFinite(v) || v <= 0) return 0
                            if (measurementType === 'WEIGHT') {
                                const unit = weightUnits[s.id] || 'kg'
                                return Math.round(unit === 'kg' ? v * 1000 : v)
                            }
                            if (measurementType === 'LENGTH') {
                                const unit = lengthUnits[s.id] || 'm'
                                return Math.round(unit === 'm' ? v * 100 : v)
                            }
                            if (measurementType === 'VOLUME') {
                                const unit = volumeUnits[s.id] || 'l'
                                return Math.round(unit === 'l' ? v * 1000 : v)
                            }
                            if (measurementType === 'AREA') {
                                const unit = areaUnits[s.id] || 'm²'
                                return Math.round(unit === 'm²' ? v * 10000 : v)
                            }
                            return Math.round(v)
                        })(),
                        sku: (s.sku || '').trim() || null
                    })),
            }
            // If image selected, send multipart with payload + file; else JSON
            let res: Response
            if (imageFile) {
                const fd = new FormData()
                fd.append('payload', JSON.stringify(payload))
                fd.append('file', imageFile)
                res = await fetch('/api/items/box', { method: 'POST', body: fd })
            } else {
                res = await fetch('/api/items/box', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }
            const data = await res.json()
            if (!res.ok) { const err = data.error || 'Failed to add box'; setMessage(err); toast.error(err); return }
            setMessage(t('toasts.boxAdded'))
            toast.success(t('toasts.boxAdded'))
            setOpen(false)
            onDone?.()
            // reset only non-persisted fields; keep sizes for next box until user resets
            setBaseName(''); setColor(''); setPrice(''); setBoxCost(''); setSkuPrefix(''); setImageFile(null)
        } catch {
            setMessage(t('toasts.networkError'))
            toast.error(t('toasts.networkError'))
        } finally {
            setLoading(false)
        }
    }

    async function createCategoryInline() {
        if (!newCatName.trim()) { setCatMsg(t('forms.enterName')); return }
        setCatLoading(true); setCatMsg('')
        try {
            const r = await fetch('/api/item-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName.trim(), ...(teamId ? { teamId } : {}) }),
            })
            const data = await r.json()
            if (!r.ok) { setCatMsg(data.error || tc('errors.failed')); return }
            setCategories(prev => {
                const next = [...prev, { id: data.id, name: data.name }]
                next.sort((a, b) => a.name.localeCompare(b.name))
                return next
            })
            setCategoryId(data.id)
            setCreatingCat(false)
            setNewCatName('')
        } catch { setCatMsg(t('toasts.networkError')); toast.error(t('toasts.networkError')) } finally { setCatLoading(false) }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Icon-only button on small screens */}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('buttons.addBox')}
                    className="inline-flex items-center justify-center rounded-md bg-white p-2 text-sm font-semibold text-indigo-700 shadow-xs inset-ring inset-ring-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-transparent dark:text-indigo-400 dark:inset-ring-indigo-500/40 dark:hover:bg-indigo-500/10 dark:focus-visible:outline-indigo-500 sm:hidden"
                >
                    {(() => {
                        // lazy require so we don't need to edit top imports; uses lucide-react Plus icon
                        return <Plus className="w-5 h-5" />
                    })()}
                </button>

                {/* Full text button on sm+ screens */}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="hidden sm:inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-xs inset-ring inset-ring-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-transparent dark:text-indigo-400 dark:inset-ring-indigo-500/40 dark:hover:bg-indigo-500/10 dark:focus-visible:outline-indigo-500"
                >
                    {t('buttons.addBox')}
                </button>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('buttons.addBox')}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create or update multiple size items in one go. All items share the same base name, color and price.</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('modals.editBox.pictureHint')}</p>

                <form onSubmit={submit} className="mt-4 space-y-3">
                    <Input id="baseName" name="baseName" type="text" className="" placeholder={t('forms.baseName')} value={baseName} onChange={(e) => setBaseName(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <Input id="color" name="color" type="text" className="" placeholder={t('forms.colorOptional')} value={color} onChange={(e) => setColor(e.target.value)} />
                        <Input id="price" name="price" type="number" className="" placeholder={t('labels.price')} value={price} onChange={(e) => setPrice(e.target.value)} />
                        <Input id="boxCost" name="boxCost" type="number" className="" placeholder={t('modals.editBox.boxCost')} value={boxCost} onChange={(e) => setBoxCost(e.target.value)} />
                        <Input id="tax" name="tax" type="number" className="" placeholder={`${t('labels.tax')} (bps)`} value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
                    </div>
                    {/* Category selector with inline create */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.category')}</label>
                        <div className="inline-block">
                            <Dropdown
                                align="left"
                                buttonLabel={categoryId ? (categories.find(c => c.id === categoryId)?.name ?? t('forms.category')) : t('forms.noCategory')}
                                items={[{ key: '', label: t('forms.noCategory') }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                onSelect={(key) => setCategoryId(key)}
                            />
                        </div>
                        {!creatingCat ? (
                            <div className="mt-2">
                                <button type="button" onClick={() => { setCreatingCat(true); setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ {tc('createNewCategory')}</button>
                            </div>
                        ) : (
                            <div className="mt-2 flex items-center gap-2">
                                <Input id="newCategoryBox" name="newCategoryBox" type="text" className="" placeholder={t('forms.newCategoryName')} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
                                <button type="button" onClick={createCategoryInline} disabled={catLoading} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{catLoading && <Spinner size={14} className="text-white" />}<span>{catLoading ? tc('saving') : tc('create')}</span></button>
                            </div>
                        )}
                        {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.measurementType')}</label>
                            <div className="inline-block">
                                <Dropdown
                                    align="left"
                                    buttonLabel={(
                                        [
                                            { key: 'PCS', label: t('forms.measurementOptions.PCS') },
                                            { key: 'WEIGHT', label: t('forms.measurementOptions.WEIGHT') },
                                            { key: 'LENGTH', label: t('forms.measurementOptions.LENGTH') },
                                            { key: 'VOLUME', label: t('forms.measurementOptions.VOLUME') },
                                            { key: 'AREA', label: t('forms.measurementOptions.AREA') },
                                        ] as Array<{ key: typeof measurementType; label: string }>
                                    ).find(o => o.key === measurementType)?.label || t('forms.select')}
                                    items={[
                                        { key: 'PCS', label: t('forms.measurementOptions.PCS') },
                                        { key: 'WEIGHT', label: t('forms.measurementOptions.WEIGHT') },
                                        { key: 'LENGTH', label: t('forms.measurementOptions.LENGTH') },
                                        { key: 'VOLUME', label: t('forms.measurementOptions.VOLUME') },
                                        { key: 'AREA', label: t('forms.measurementOptions.AREA') },
                                    ]}
                                    onSelect={(key) => setMeasurementType(key as typeof measurementType)}
                                />
                            </div>
                        </div>
                        <Input id="skuPrefix" name="skuPrefix" type="text" className="" placeholder={t('forms.skuPrefix')} value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} />
                        {/* spacer for layout */}
                        <div />
                    </div>

                    {/* Optional picture for the whole box */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.boxPicture')}</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('forms.pictureHint')}</p>
                    </div>

                    <div>
                        <div className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-200">{t('forms.sizesInBox')}</div>
                        <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                            Each row represents a size/variant (e.g., 35, M). Quantity adds stock per item using the selected measurement
                            type ({measurementType === 'PCS' ? 'pieces'
                                : measurementType === 'WEIGHT' ? 'kg'
                                    : measurementType === 'LENGTH' ? 'm'
                                        : measurementType === 'VOLUME' ? 'l'
                                            : measurementType === 'AREA' ? 'm²'
                                                : 'hours'}).
                        </p>
                        <div className="space-y-2">
                            {sizes.map((row, idx) => (
                                <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                                    <div className="col-span-5"><Input id={`size-${row.id}`} name={`size-${idx}`} type="text" className="" placeholder={`${t('modals.editBox.variantSize')} (e.g. 35, M)`} value={row.size} onChange={(e) => updateRow(row.id, { size: e.target.value })} /></div>
                                    <div className="col-span-5">
                                        {measurementType === 'WEIGHT' && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                                <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                    <button type="button" onClick={() => setWeightUnits(prev => ({ ...prev, [row.id]: 'kg' }))} className={`px-2 py-1 text-xs ${((weightUnits[row.id] || 'kg') === 'kg') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>kg</button>
                                                    <button type="button" onClick={() => setWeightUnits(prev => ({ ...prev, [row.id]: 'g' }))} className={`px-2 py-1 text-xs ${((weightUnits[row.id] || 'kg') === 'g') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>g</button>
                                                </div>
                                            </div>
                                        )}
                                        {measurementType === 'LENGTH' && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                                <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                    <button type="button" onClick={() => setLengthUnits(prev => ({ ...prev, [row.id]: 'm' }))} className={`px-2 py-1 text-xs ${((lengthUnits[row.id] || 'm') === 'm') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m</button>
                                                    <button type="button" onClick={() => setLengthUnits(prev => ({ ...prev, [row.id]: 'cm' }))} className={`px-2 py-1 text-xs ${((lengthUnits[row.id] || 'm') === 'cm') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm</button>
                                                </div>
                                            </div>
                                        )}
                                        {measurementType === 'VOLUME' && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                                <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                    <button type="button" onClick={() => setVolumeUnits(prev => ({ ...prev, [row.id]: 'l' }))} className={`px-2 py-1 text-xs ${((volumeUnits[row.id] || 'l') === 'l') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>l</button>
                                                    <button type="button" onClick={() => setVolumeUnits(prev => ({ ...prev, [row.id]: 'ml' }))} className={`px-2 py-1 text-xs ${((volumeUnits[row.id] || 'l') === 'ml') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>ml</button>
                                                </div>
                                            </div>
                                        )}
                                        {measurementType === 'AREA' && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                                <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                    <button type="button" onClick={() => setAreaUnits(prev => ({ ...prev, [row.id]: 'm²' }))} className={`px-2 py-1 text-xs ${((areaUnits[row.id] || 'm²') === 'm²') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m²</button>
                                                    <button type="button" onClick={() => setAreaUnits(prev => ({ ...prev, [row.id]: 'cm²' }))} className={`px-2 py-1 text-xs ${((areaUnits[row.id] || 'm²') === 'cm²') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm²</button>
                                                </div>
                                            </div>
                                        )}
                                        <Input id={`qty-${row.id}`} name={`quantity-${idx}`} type="number" className="" placeholder={`Quantity (${measurementType === 'PCS' ? 'pcs' : measurementType === 'WEIGHT' ? (weightUnits[row.id] || 'kg') : measurementType === 'LENGTH' ? (lengthUnits[row.id] || 'm') : measurementType === 'VOLUME' ? (volumeUnits[row.id] || 'l') : measurementType === 'AREA' ? (areaUnits[row.id] || 'm²') : 'pcs'})`} value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} />
                                        {measurementType === 'WEIGHT' && row.quantity && Number(row.quantity) > 0 && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {(weightUnits[row.id] || 'kg') === 'kg' ? `${Math.round(Number(row.quantity) * 1000)} g will be saved` : `${(Number(row.quantity) / 1000).toFixed(3)} kg`}
                                            </p>
                                        )}
                                        {measurementType === 'LENGTH' && row.quantity && Number(row.quantity) > 0 && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {(lengthUnits[row.id] || 'm') === 'm' ? `${Math.round(Number(row.quantity) * 100)} cm will be saved` : `${(Number(row.quantity) / 100).toFixed(2)} m`}
                                            </p>
                                        )}
                                        {measurementType === 'VOLUME' && row.quantity && Number(row.quantity) > 0 && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {(volumeUnits[row.id] || 'l') === 'l' ? `${Math.round(Number(row.quantity) * 1000)} ml will be saved` : `${(Number(row.quantity) / 1000).toFixed(3)} l`}
                                            </p>
                                        )}
                                        {measurementType === 'AREA' && row.quantity && Number(row.quantity) > 0 && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {(areaUnits[row.id] || 'm²') === 'm²' ? `${Math.round(Number(row.quantity) * 10000)} cm² will be saved` : `${(Number(row.quantity) / 10000).toFixed(2)} m²`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button type="button" onClick={() => removeRow(row.id)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{t('modals.editBox.remove')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <button type="button" onClick={addRow} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{t('modals.editBox.addSize')}</button>
                            <button type="button" onClick={resetSizes} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-200 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">{t('forms.resetSizes')}</button>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('forms.stockAddsNote')}</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
                            <button type="submit" disabled={loading} aria-busy={loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{loading && <Spinner size={16} className="text-white" />}<span>{loading ? tc('saving') : t('buttons.addBox')}</span></button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </>
    )
}
