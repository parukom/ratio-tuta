'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import Spinner from '@/components/ui/Spinner'
import ImageUploader from '@/components/ui/ImageUploader'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { Plus, PackageX, Info } from 'lucide-react'
import { useHelp } from '@/hooks/useHelp'

type Mode = 'item' | 'box'

type Props = {
    teamId?: string
    // Box form: optionally preselect a category
    defaultCategoryId?: string | null
    // Callbacks
    onItemCreated?: (item: ItemCreated) => void
    onBoxDone?: () => void
    // When true, the item form won't show a success toast (parents can own toasts)
    suppressItemToast?: boolean
}

// Stable localStorage keys for the Box form
const LS_TAX = 'box:taxRateBps'
const LS_CATEGORY = 'box:categoryId'
const LS_MT = 'box:measurementType'
const LS_SIZES = 'box:sizes'

type SizeRow = { id: string; size: string; quantity: string; sku?: string }

type ItemCreated = {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    price: number
    pricePaid?: number
    taxRateBps: number
    isActive: boolean
    createdAt: string
    imageUrl?: string
}

export default function CreateItemOrBoxButton({
    teamId,
    defaultCategoryId,
    onItemCreated,
    onBoxDone,
    suppressItemToast,
}: Props) {
    const t = useTranslations('Items')
    const tc = useTranslations('Common')
    const { showHelp } = useHelp()

    const [open, setOpen] = useState(false)
    const [limitModal, setLimitModal] = useState(false)
    const [limitInfo, setLimitInfo] = useState<{ allowed: boolean; remaining: number | null; max: number | null; current: number } | null>(null)
    const [checkingLimit, setCheckingLimit] = useState(false)
    const [mode, setMode] = useState<Mode>('item')

    // Shared categories list
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    const loadCategories = useCallback(async () => {
        try {
            const qs = new URLSearchParams()
            if (teamId) qs.set('teamId', teamId)
            qs.set('onlyActive', 'true')
            const r = await fetch(`/api/item-categories?${qs.toString()}`)
            if (!r.ok) return setCategories([])
            const data = (await r.json()) as Array<{ id: string; name: string }>
            setCategories(Array.isArray(data) ? data.map((c) => ({ id: String(c.id), name: String(c.name) })) : [])
        } catch {
            setCategories([])
        }
    }, [teamId])
    useEffect(() => { if (open) loadCategories() }, [open, loadCategories])

    // --------------------------------------------------
    // Item form state
    // --------------------------------------------------
    const [it_loading, it_setLoading] = useState(false)
    const [it_message, it_setMessage] = useState('')
    const [it_name, it_setName] = useState('')
    const [it_sku, it_setSku] = useState('')
    const [it_price, it_setPrice] = useState('')
    const [it_pricePaid, it_setPricePaid] = useState('')
    const [it_taxRateBps, it_setTaxRateBps] = useState('0')
    const [it_isActive, it_setIsActive] = useState(true)
    const [it_measurementType, it_setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'>('PCS')
    const [it_stockQuantity, it_setStockQuantity] = useState('0')
    const [it_weightUnit, it_setWeightUnit] = useState<'kg' | 'g'>('kg')
    const [it_lengthUnit, it_setLengthUnit] = useState<'m' | 'cm'>('m')
    const [it_volumeUnit, it_setVolumeUnit] = useState<'l' | 'ml'>('l')
    const [it_areaUnit, it_setAreaUnit] = useState<'m²' | 'cm²'>('m²')
    const [it_description, it_setDescription] = useState('')
    const [it_color, it_setColor] = useState('')
    const [it_brand, it_setBrand] = useState('')
    const [it_tagsCSV, it_setTagsCSV] = useState('')
    const [it_imageFile, it_setImageFile] = useState<File | null>(null)
    const [it_categoryId, it_setCategoryId] = useState<string | ''>('')
    const [it_creatingCat, it_setCreatingCat] = useState(false)
    const [it_newCatName, it_setNewCatName] = useState('')
    const [it_catLoading, it_setCatLoading] = useState(false)
    const [it_catMsg, it_setCatMsg] = useState('')

    function it_reset() {
        it_setName(''); it_setSku(''); it_setPrice(''); it_setPricePaid(''); it_setTaxRateBps('0'); it_setIsActive(true); it_setMeasurementType('PCS'); it_setStockQuantity('0'); it_setWeightUnit('kg'); it_setLengthUnit('m'); it_setVolumeUnit('l'); it_setAreaUnit('m²'); it_setDescription(''); it_setColor(''); it_setBrand(''); it_setTagsCSV(''); it_setCategoryId(''); it_setCreatingCat(false); it_setNewCatName(''); it_setCatMsg(''); it_setImageFile(null)
    }

    async function it_submit(e: React.FormEvent) {
        e.preventDefault()
        it_setMessage('')
        it_setLoading(true)
        try {
            if (!it_imageFile) {
                it_setMessage(t('forms.pictureRequired'))
                toast(t('forms.pictureRequired'), { icon: '📷' })
                it_setLoading(false)
                return
            }
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(teamId ? { teamId } : {}),
                    name: it_name,
                    sku: it_sku || null,
                    categoryId: it_categoryId || null,
                    price: Number(it_price),
                    pricePaid: Number(it_pricePaid) || 0,
                    taxRateBps: Number(it_taxRateBps) || 0,
                    isActive: it_isActive,
                    measurementType: it_measurementType,
                    stockQuantity: (() => {
                        const v = Number(it_stockQuantity)
                        if (!Number.isFinite(v) || v < 0) return 0
                        if (it_measurementType === 'WEIGHT') {
                            return Math.round((it_weightUnit === 'kg' ? v * 1000 : v))
                        }
                        if (it_measurementType === 'LENGTH') {
                            return Math.round((it_lengthUnit === 'm' ? v * 100 : v))
                        }
                        if (it_measurementType === 'VOLUME') {
                            return Math.round((it_volumeUnit === 'l' ? v * 1000 : v))
                        }
                        if (it_measurementType === 'AREA') {
                            return Math.round((it_areaUnit === 'm²' ? v * 10000 : v))
                        }
                        return Math.round(v)
                    })(),
                    description: it_description.trim() || null,
                    color: it_color.trim() || null,
                    brand: it_brand.trim() || null,
                    tags: it_tagsCSV.split(',').map((t) => t.trim()).filter(Boolean),
                }),
            })
            const data = await res.json()
            if (!res.ok) { const err = data.error || 'Failed to create'; it_setMessage(err); toast.error(err); return }
            let created = data
            // upload image
            if (it_imageFile) {
                try {
                    const fd = new FormData()
                    fd.append('file', it_imageFile)
                    const up = await fetch(`/api/items/${data.id}/image`, { method: 'POST', body: fd })
                    const upData = await up.json()
                    if (up.ok) created = { ...data, imageUrl: upData.imageUrl }
                    else toast.error(upData.error || 'Failed to upload image')
                } catch { toast.error('Failed to upload image') }
            }
            it_setMessage(t('toasts.created'))
            if (!suppressItemToast) toast.success(t('toasts.created'))
            onItemCreated?.(created)
            it_reset()
            setOpen(false)
        } catch {
            it_setMessage(t('toasts.networkError'))
            toast.error(t('toasts.networkError'))
        } finally {
            it_setLoading(false)
        }
    }

    async function it_createCategoryInline() {
        if (!it_newCatName.trim()) { it_setCatMsg(t('forms.enterName')); toast(t('forms.enterName'), { icon: '⚠️' }); return }
        it_setCatLoading(true); it_setCatMsg('')
        try {
            const r = await fetch('/api/item-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: it_newCatName.trim(), ...(teamId ? { teamId } : {}) }),
            })
            const data = await r.json()
            if (!r.ok) { const err = data.error || tc('errors.failed'); it_setCatMsg(err); toast.error(err); return }
            setCategories(prev => {
                const next = [...prev, { id: data.id, name: data.name }]
                next.sort((a, b) => a.name.localeCompare(b.name))
                return next
            })
            it_setCategoryId(data.id)
            it_setCreatingCat(false)
            it_setNewCatName('')
            toast.success(t('toasts.categoryCreated'))
        } catch {
            it_setCatMsg(t('toasts.networkError'))
            toast.error(t('toasts.networkError'))
        } finally { it_setCatLoading(false) }
    }

    // --------------------------------------------------
    // Box form state
    // --------------------------------------------------
    const genId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const [bx_loading, bx_setLoading] = useState(false)
    const [bx_message, bx_setMessage] = useState('')
    const [bx_baseName, bx_setBaseName] = useState('')
    const [bx_color, bx_setColor] = useState('')
    const [bx_price, bx_setPrice] = useState('')
    const [bx_boxCost, bx_setBoxCost] = useState('')
    const [bx_taxRateBps, bx_setTaxRateBps] = useState('0')
    const [bx_measurementType, bx_setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'>('PCS')
    const [bx_skuPrefix, bx_setSkuPrefix] = useState('')
    const [bx_imageFile, bx_setImageFile] = useState<File | null>(null)
    const [bx_categoryId, bx_setCategoryId] = useState<string | ''>(defaultCategoryId || '')
    const [bx_creatingCat, bx_setCreatingCat] = useState(false)
    const [bx_newCatName, bx_setNewCatName] = useState('')
    const [bx_catLoading, bx_setCatLoading] = useState(false)
    const [bx_catMsg, bx_setCatMsg] = useState('')
    const [bx_sizes, bx_setSizes] = useState<SizeRow[]>([{ id: genId(), size: '', quantity: '0' }])
    const [bx_weightUnits, bx_setWeightUnits] = useState<Record<string, 'kg' | 'g'>>({})

    // Load persisted values when opening modal (only for Box tab)
    useEffect(() => {
        if (!open) return
        try {
            const vTax = localStorage.getItem(LS_TAX)
            if (vTax != null) bx_setTaxRateBps(vTax)

            const allowed = ['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA'] as const
            const vMT = localStorage.getItem(LS_MT) as typeof bx_measurementType | null
            if (vMT && (allowed as readonly string[]).includes(vMT)) bx_setMeasurementType(vMT)

            const vCat = localStorage.getItem(LS_CATEGORY)
            if (typeof vCat === 'string') bx_setCategoryId(vCat)

            const raw = localStorage.getItem(LS_SIZES)
            if (raw) {
                try {
                    const arr = JSON.parse(raw) as Array<{ size: string; quantity: string | number; sku?: string }>
                    if (Array.isArray(arr) && arr.length) {
                        const mapped = arr.map((r) => ({ id: genId(), size: String(r.size ?? ''), quantity: String(r.quantity ?? '0'), sku: r.sku ? String(r.sku) : undefined }))
                        bx_setSizes(mapped.length ? mapped : [{ id: genId(), size: '', quantity: '0' }])
                    }
                } catch { /* ignore parse */ }
            }
        } catch { /* ignore */ }
    }, [open])

    // Ensure stored category still exists after categories load (Box)
    useEffect(() => {
        if (!open) return
        if (bx_categoryId && !categories.some(c => c.id === bx_categoryId)) bx_setCategoryId('')
    }, [open, categories, bx_categoryId])

    // Persist Box changes
    useEffect(() => { try { localStorage.setItem(LS_TAX, bx_taxRateBps || '0') } catch { } }, [bx_taxRateBps])
    useEffect(() => { try { localStorage.setItem(LS_CATEGORY, bx_categoryId || '') } catch { } }, [bx_categoryId])
    useEffect(() => { try { localStorage.setItem(LS_MT, bx_measurementType) } catch { } }, [bx_measurementType])
    useEffect(() => {
        try {
            const compact = bx_sizes
                .filter(s => (s.size?.trim() || s.quantity?.toString().trim()))
                .map(s => ({ size: s.size.trim(), quantity: String(s.quantity || '0'), ...(s.sku ? { sku: s.sku } : {}) }))
            if (compact.length) localStorage.setItem(LS_SIZES, JSON.stringify(compact))
            else localStorage.removeItem(LS_SIZES)
        } catch { /* ignore */ }
    }, [bx_sizes])

    function bx_addRow() {
        const id = genId()
        bx_setSizes(prev => [...prev, { id, size: '', quantity: '0' }])
        bx_setWeightUnits(prev => ({ ...prev, [id]: 'kg' }))
    }
    function bx_removeRow(id: string) {
        bx_setSizes(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
        bx_setWeightUnits(prev => { const next = { ...prev }; delete next[id]; return next })
    }
    function bx_updateRow(id: string, patch: Partial<SizeRow>) {
        bx_setSizes(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
    }
    function bx_resetSizes() {
        try { localStorage.removeItem(LS_SIZES) } catch { }
        const id = genId()
        bx_setSizes([{ id, size: '', quantity: '0' }])
        bx_setWeightUnits({ [id]: 'kg' })
    }

    async function bx_submit(e: React.FormEvent) {
        e.preventDefault()
        bx_setMessage('')
        bx_setLoading(true)
        try {
            const payload = {
                ...(teamId ? { teamId } : {}),
                baseName: bx_baseName,
                color: bx_color || null,
                categoryId: (bx_categoryId || undefined),
                price: Number(bx_price),
                boxCost: Number(bx_boxCost) || 0,
                taxRateBps: Number(bx_taxRateBps) || 0,
                measurementType: bx_measurementType,
                skuPrefix: bx_skuPrefix || null,
                sizes: bx_sizes
                    .filter(s => s.size.trim() && Number(s.quantity) > 0)
                    .map(s => ({
                        size: s.size.trim(),
                        quantity: (() => {
                            const v = Number(s.quantity)
                            if (!Number.isFinite(v) || v <= 0) return 0
                            if (bx_measurementType === 'WEIGHT') {
                                const unit = bx_weightUnits[s.id] || 'kg'
                                return Math.round(unit === 'kg' ? v * 1000 : v)
                            }
                            return Math.round(v)
                        })(),
                        sku: (s.sku || '').trim() || null,
                    })),
            }

            let res: Response
            if (bx_imageFile) {
                const fd = new FormData()
                fd.append('payload', JSON.stringify(payload))
                fd.append('file', bx_imageFile)
                res = await fetch('/api/items/box', { method: 'POST', body: fd })
            } else {
                res = await fetch('/api/items/box', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            }
            const data = await res.json()
            if (!res.ok) { const err = data.error || 'Failed to add box'; bx_setMessage(err); toast.error(err); return }
            bx_setMessage(t('toasts.boxAdded'))
            toast.success(t('toasts.boxAdded'))
            setOpen(false)
            onBoxDone?.()
            // reset non-persisted fields
            bx_setBaseName(''); bx_setColor(''); bx_setPrice(''); bx_setBoxCost(''); bx_setSkuPrefix(''); bx_setImageFile(null)
        } catch {
            bx_setMessage(t('toasts.networkError'))
            toast.error(t('toasts.networkError'))
        } finally {
            bx_setLoading(false)
        }
    }

    async function bx_createCategoryInline() {
        if (!bx_newCatName.trim()) { bx_setCatMsg(t('forms.enterName')); return }
        bx_setCatLoading(true); bx_setCatMsg('')
        try {
            const r = await fetch('/api/item-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: bx_newCatName.trim(), ...(teamId ? { teamId } : {}) }),
            })
            const data = await r.json()
            if (!r.ok) { bx_setCatMsg(data.error || tc('errors.failed')); return }
            setCategories(prev => {
                const next = [...prev, { id: data.id, name: data.name }]
                next.sort((a, b) => a.name.localeCompare(b.name))
                return next
            })
            bx_setCategoryId(data.id)
            bx_setCreatingCat(false)
            bx_setNewCatName('')
        } catch { bx_setCatMsg(t('toasts.networkError')); toast.error(t('toasts.networkError')) } finally { bx_setCatLoading(false) }
    }

    // Toggle pill for switching forms
    const Toggle = useMemo(() => (
        <div className="inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
            <button type="button" onClick={() => setMode('item')} className={`px-3 py-1.5 text-xs sm:text-sm font-medium ${mode === 'item' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>{tc('createItem')}</button>
            <button type="button" onClick={() => setMode('box')} className={`px-3 py-1.5 text-xs sm:text-sm font-medium ${mode === 'box' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>{t('buttons.addBox')}</button>
        </div>
    ), [mode, t, tc])

    return (
        <>
            <button
                type="button"
                onClick={async () => {
                    if (!teamId) { setOpen(true); return }
                    setCheckingLimit(true)
                    try {
                        const r = await fetch(`/api/teams/${teamId}/limits/items`)
                        if (r.ok) {
                            const data = await r.json()
                            setLimitInfo(data)
                            if (data && data.allowed) setOpen(true)
                            else setLimitModal(true)
                        } else {
                            setOpen(true) // fail open
                        }
                    } catch { setOpen(true) }
                    finally { setCheckingLimit(false) }
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
                <Plus className="h-4 w-4" />
                <span className='hidden md:inline-block'>{checkingLimit ? t('loading') : tc('create')}</span>
            </button>

            {/* Limit modal */}
            <Modal open={limitModal} onClose={() => setLimitModal(false)} size="sm">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                        <PackageX className="h-5 w-5 text-red-500 dark:text-red-300" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('limit.title')}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {limitInfo?.max != null ? t('limit.body', { max: limitInfo.max }) : t('limit.bodyUnlimited')}
                        </p>
                        {limitInfo && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                    <span>{t('limit.usageLabel')}</span>
                                    <span>{limitInfo.current}{limitInfo.max != null ? ` / ${limitInfo.max}` : ''}</span>
                                </div>
                                <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <div className="h-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${limitInfo.max ? Math.min(100, Math.round((limitInfo.current / limitInfo.max) * 100)) : 100}%` }} />
                                </div>
                                {limitInfo.max != null && limitInfo.current >= limitInfo.max && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{t('limit.reachedHint')}</p>
                                )}
                                <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>{t('limit.benefitMoreItems')}</li>
                                    <li>{t('limit.benefitHigherPlan')}</li>
                                </ul>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setLimitModal(false)} className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20">{tc('close')}</button>
                            <a href="/pricing" className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400">{t('limit.upgradeCta')}</a>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <div className="flex items-start justify-between gap-3 pr-10">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {mode === 'item' ? tc('createItem') : t('buttons.addBox')}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {mode === 'item' ? t('modals.create.itemIntro') : t('modals.create.boxIntro')}
                        </p>
                    </div>
                </div>
                <div className="mt-2">{Toggle}</div>

                {showHelp && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                            <Info className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-900 dark:text-blue-100 space-y-1">
                                {mode === 'item' ? (
                                    <>
                                        <p><strong>{t('modals.create.help.item.title')}</strong></p>
                                        <p>{t('modals.create.help.item.description')}</p>
                                        <p className="mt-2"><strong>{t('modals.create.help.item.measurementTitle')}</strong></p>
                                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                                            <li>{t('modals.create.help.item.measurementPCS')}</li>
                                            <li>{t('modals.create.help.item.measurementWeight')}</li>
                                            <li>{t('modals.create.help.item.measurementOther')}</li>
                                        </ul>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>{t('modals.create.help.box.title')}</strong></p>
                                        <p>{t('modals.create.help.box.description')}</p>
                                        <p className="mt-2"><strong>{t('modals.create.help.box.exampleTitle')}</strong></p>
                                        <p>{t('modals.create.help.box.example')}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Forms container */}
                <div className="mt-4">
                    {mode === 'item' ? (
                        <form onSubmit={it_submit} className="space-y-3">
                            <ImageUploader
                                id="it_image"
                                label={t('forms.picture')}
                                required
                                value={it_imageFile}
                                onChange={it_setImageFile}
                                hint={t('forms.pictureHint')}

                            />
                            <div>
                                <label htmlFor="it_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tc('name')} *</label>
                                <Input id="it_name" name="name" type="text" placeholder="" value={it_name} onChange={(e) => it_setName(e.target.value)} />
                            </div>
                            <div>
                                <label htmlFor="it_sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.sku')}</label>
                                <Input id="it_sku" name="sku" type="text" placeholder="" value={it_sku} onChange={(e) => it_setSku(e.target.value)} />
                            </div>
                            {/* Category selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.category')}</label>
                                <div className="inline-block">
                                    <Dropdown
                                        align="left"
                                        buttonLabel={it_categoryId ? (categories.find(c => c.id === it_categoryId)?.name ?? t('forms.category')) : t('forms.noCategory')}
                                        items={[{ key: '', label: t('forms.noCategory') }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                        onSelect={(key) => it_setCategoryId(key)}
                                    />
                                </div>
                                {!it_creatingCat ? (
                                    <div className="mt-2">
                                        <button type="button" onClick={() => { it_setCreatingCat(true); it_setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ {tc('createNewCategory')}</button>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Input id="it_newCategory" name="newCategory" type="text" placeholder={t('forms.newCategoryName')} value={it_newCatName} onChange={(e) => it_setNewCatName(e.target.value)} />
                                        <button type="button" onClick={() => it_setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('cancel')}</button>
                                        <button type="button" onClick={it_createCategoryInline} disabled={it_catLoading} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{it_catLoading && <Spinner size={14} className="text-white" />}<span>{it_catLoading ? tc('saving') : tc('create')}</span></button>
                                    </div>
                                )}
                                {it_catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{it_catMsg}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor="it_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labels.price')} *</label>
                                    <Input id="it_price" name="price" type="number" step="0.01" placeholder="" value={it_price} onChange={(e) => it_setPrice(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="it_pricePaid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('card.cost')}</label>
                                    <Input id="it_pricePaid" name="pricePaid" type="number" step="0.01" placeholder="" value={it_pricePaid} onChange={(e) => it_setPricePaid(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="it_taxRateBps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labels.tax')} (bps)</label>
                                    <Input id="it_taxRateBps" name="taxRateBps" type="number" placeholder="" value={it_taxRateBps} onChange={(e) => it_setTaxRateBps(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                                ] as Array<{ key: typeof it_measurementType; label: string }>
                                            ).find(o => o.key === it_measurementType)?.label || t('forms.select')}
                                            items={[
                                                { key: 'PCS', label: t('forms.measurementOptions.PCS') },
                                                { key: 'WEIGHT', label: t('forms.measurementOptions.WEIGHT') },
                                                { key: 'LENGTH', label: t('forms.measurementOptions.LENGTH') },
                                                { key: 'VOLUME', label: t('forms.measurementOptions.VOLUME') },
                                                { key: 'AREA', label: t('forms.measurementOptions.AREA') },
                                            ]}
                                            onSelect={(key) => {
                                                it_setMeasurementType(key as typeof it_measurementType)
                                                if (key !== 'WEIGHT') it_setWeightUnit('kg')
                                                if (key !== 'LENGTH') it_setLengthUnit('m')
                                                if (key !== 'VOLUME') it_setVolumeUnit('l')
                                                if (key !== 'AREA') it_setAreaUnit('m²')
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    {it_measurementType === 'WEIGHT' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                            <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                <button type="button" onClick={() => it_setWeightUnit('kg')} className={`px-2 py-1 text-xs ${it_weightUnit === 'kg' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>kg</button>
                                                <button type="button" onClick={() => it_setWeightUnit('g')} className={`px-2 py-1 text-xs ${it_weightUnit === 'g' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>g</button>
                                            </div>
                                        </div>
                                    )}
                                    {it_measurementType === 'LENGTH' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                            <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                <button type="button" onClick={() => it_setLengthUnit('m')} className={`px-2 py-1 text-xs ${it_lengthUnit === 'm' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m</button>
                                                <button type="button" onClick={() => it_setLengthUnit('cm')} className={`px-2 py-1 text-xs ${it_lengthUnit === 'cm' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm</button>
                                            </div>
                                        </div>
                                    )}
                                    {it_measurementType === 'VOLUME' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                            <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                <button type="button" onClick={() => it_setVolumeUnit('l')} className={`px-2 py-1 text-xs ${it_volumeUnit === 'l' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>l</button>
                                                <button type="button" onClick={() => it_setVolumeUnit('ml')} className={`px-2 py-1 text-xs ${it_volumeUnit === 'ml' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>ml</button>
                                            </div>
                                        </div>
                                    )}
                                    {it_measurementType === 'AREA' && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                                            <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                <button type="button" onClick={() => it_setAreaUnit('m²')} className={`px-2 py-1 text-xs ${it_areaUnit === 'm²' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m²</button>
                                                <button type="button" onClick={() => it_setAreaUnit('cm²')} className={`px-2 py-1 text-xs ${it_areaUnit === 'cm²' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm²</button>
                                            </div>
                                        </div>
                                    )}
                                    <Input
                                        id="it_stockQuantity"
                                        name="stockQuantity"
                                        type="number"
                                        placeholder={
                                            it_measurementType === 'PCS' ? t('forms.initialStock.PCS')
                                                : it_measurementType === 'WEIGHT' ? `Stock (${it_weightUnit})`
                                                    : it_measurementType === 'LENGTH' ? `Stock (${it_lengthUnit})`
                                                        : it_measurementType === 'VOLUME' ? `Stock (${it_volumeUnit})`
                                                            : it_measurementType === 'AREA' ? `Stock (${it_areaUnit})`
                                                                : t('forms.initialStock.PCS')
                                        }
                                        value={it_stockQuantity}
                                        onChange={(e) => it_setStockQuantity(e.target.value)}
                                    />
                                    {it_measurementType === 'WEIGHT' && it_stockQuantity && Number(it_stockQuantity) > 0 && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {it_weightUnit === 'kg' ? `${Math.round(Number(it_stockQuantity) * 1000)} g will be saved` : `${(Number(it_stockQuantity) / 1000).toFixed(3)} kg`}
                                        </p>
                                    )}
                                    {it_measurementType === 'LENGTH' && it_stockQuantity && Number(it_stockQuantity) > 0 && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {it_lengthUnit === 'm' ? `${Math.round(Number(it_stockQuantity) * 100)} cm will be saved` : `${(Number(it_stockQuantity) / 100).toFixed(2)} m`}
                                        </p>
                                    )}
                                    {it_measurementType === 'VOLUME' && it_stockQuantity && Number(it_stockQuantity) > 0 && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {it_volumeUnit === 'l' ? `${Math.round(Number(it_stockQuantity) * 1000)} ml will be saved` : `${(Number(it_stockQuantity) / 1000).toFixed(3)} l`}
                                        </p>
                                    )}
                                    {it_measurementType === 'AREA' && it_stockQuantity && Number(it_stockQuantity) > 0 && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {it_areaUnit === 'm²' ? `${Math.round(Number(it_stockQuantity) * 10000)} cm² will be saved` : `${(Number(it_stockQuantity) / 10000).toFixed(2)} m²`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="it_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.descriptionOptional')}</label>
                                <Input id="it_description" name="description" type="text" placeholder="" value={it_description} onChange={(e) => it_setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="it_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.colorOptional')}</label>
                                    <Input id="it_color" name="color" type="text" placeholder="" value={it_color} onChange={(e) => it_setColor(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="it_brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.brandOptional')}</label>
                                    <Input id="it_brand" name="brand" type="text" placeholder="" value={it_brand} onChange={(e) => it_setBrand(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="it_tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.tagsComma')}</label>
                                <Input id="it_tags" name="tags" type="text" placeholder="" value={it_tagsCSV} onChange={(e) => it_setTagsCSV(e.target.value)} />
                            </div>
                            {/* ImageUploader placed at the top, so remove old input */}
                            <div className="flex items-center gap-2">
                                <input id="it_isActive" name="isActive" type="checkbox" checked={it_isActive} onChange={(e) => it_setIsActive(e.target.checked)} className="size-4" />
                                <label htmlFor="it_isActive" className="text-sm text-gray-700 dark:text-gray-300">{t('forms.active')}</label>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('forms.uniqueNote')}</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
                                    <button type="submit" disabled={it_loading} aria-busy={it_loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{it_loading && <Spinner size={16} className="text-white" />}<span>{it_loading ? tc('creating') : tc('create')}</span></button>
                                </div>
                            </div>
                            {it_message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{it_message}</p>}
                        </form>
                    ) : (
                        <form onSubmit={bx_submit} className="space-y-3">
                            <ImageUploader
                                id="bx_image"
                                label={t('forms.boxPicture')}
                                value={bx_imageFile}
                                onChange={bx_setImageFile}
                                hint={t('forms.pictureHint')}

                            />
                            <div>
                                <label htmlFor="bx_baseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.baseName')} *</label>
                                <Input id="bx_baseName" name="baseName" type="text" placeholder="" value={bx_baseName} onChange={(e) => bx_setBaseName(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="bx_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.colorOptional')}</label>
                                    <Input id="bx_color" name="color" type="text" placeholder="" value={bx_color} onChange={(e) => bx_setColor(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="bx_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labels.price')} *</label>
                                    <Input id="bx_price" name="price" type="number" step="0.01" placeholder="" value={bx_price} onChange={(e) => bx_setPrice(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="bx_boxCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('modals.editBox.boxCost')}</label>
                                    <Input id="bx_boxCost" name="boxCost" type="number" step="0.01" placeholder="" value={bx_boxCost} onChange={(e) => bx_setBoxCost(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="bx_tax" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('labels.tax')} (bps)</label>
                                    <Input id="bx_tax" name="tax" type="number" placeholder="" value={bx_taxRateBps} onChange={(e) => bx_setTaxRateBps(e.target.value)} />
                                </div>
                            </div>

                            {showHelp && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Info className="size-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-xs text-green-900 dark:text-green-100 space-y-1">
                                            <p><strong>{t('modals.create.help.pricing.title')}</strong></p>
                                            <ul className="list-disc list-inside space-y-0.5 ml-2">
                                                <li><strong>{t('modals.create.help.pricing.priceLabel')}</strong> {t('modals.create.help.pricing.priceDesc')}</li>
                                                <li><strong>{t('modals.create.help.pricing.boxCostLabel')}</strong> {t('modals.create.help.pricing.boxCostDesc')}</li>
                                                <li><strong>{t('modals.create.help.pricing.taxLabel')}</strong> {t('modals.create.help.pricing.taxDesc')}</li>
                                            </ul>
                                            <p className="mt-2 italic">{t('modals.create.help.pricing.example')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.category')}</label>
                                <div className="inline-block">
                                    <Dropdown
                                        align="left"
                                        buttonLabel={bx_categoryId ? (categories.find(c => c.id === bx_categoryId)?.name ?? t('forms.category')) : t('forms.noCategory')}
                                        items={[{ key: '', label: t('forms.noCategory') }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                        onSelect={(key) => bx_setCategoryId(key)}
                                    />
                                </div>
                                {!bx_creatingCat ? (
                                    <div className="mt-2">
                                        <button type="button" onClick={() => { bx_setCreatingCat(true); bx_setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ {tc('createNewCategory')}</button>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex items-center gap-2">
                                        <Input id="bx_newCategoryBox" name="newCategoryBox" type="text" placeholder={t('forms.newCategoryName')} value={bx_newCatName} onChange={(e) => bx_setNewCatName(e.target.value)} />
                                        <button type="button" onClick={() => bx_setCreatingCat(false)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
                                        <button type="button" onClick={bx_createCategoryInline} disabled={bx_catLoading} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{bx_catLoading && <Spinner size={14} className="text-white" />}<span>{bx_catLoading ? tc('saving') : tc('create')}</span></button>
                                    </div>
                                )}
                                {bx_catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{bx_catMsg}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                                ] as Array<{ key: typeof bx_measurementType; label: string }>
                                            ).find(o => o.key === bx_measurementType)?.label || t('forms.select')}
                                            items={[
                                                { key: 'PCS', label: t('forms.measurementOptions.PCS') },
                                                { key: 'WEIGHT', label: t('forms.measurementOptions.WEIGHT') },
                                                { key: 'LENGTH', label: t('forms.measurementOptions.LENGTH') },
                                                { key: 'VOLUME', label: t('forms.measurementOptions.VOLUME') },
                                                { key: 'AREA', label: t('forms.measurementOptions.AREA') },
                                            ]}
                                            onSelect={(key) => bx_setMeasurementType(key as typeof bx_measurementType)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="bx_skuPrefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.skuPrefix')}</label>
                                    <Input id="bx_skuPrefix" name="skuPrefix" type="text" placeholder="" value={bx_skuPrefix} onChange={(e) => bx_setSkuPrefix(e.target.value)} />
                                </div>
                            </div>

                            {/* ImageUploader already present above */}

                            <div>
                                <div className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-200">{t('forms.sizesInBox')}</div>
                                <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
                                    Each row represents a size/variant (e.g., 35, M). Quantity adds stock per item using the selected measurement
                                    type ({bx_measurementType === 'PCS' ? 'pieces' : bx_measurementType === 'WEIGHT' ? 'kg' : bx_measurementType === 'LENGTH' ? 'm' : bx_measurementType === 'VOLUME' ? 'l' : bx_measurementType === 'AREA' ? 'm²' : ''}).
                                </p>
                                <div className="space-y-2">
                                    {bx_sizes.map((row, idx) => (
                                        <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                                            <div className="col-span-5"><Input id={`bx_size-${row.id}`} name={`size-${idx}`} type="text" placeholder={`${t('modals.editBox.variantSize')} (e.g. 35, M)`} value={row.size} onChange={(e) => bx_updateRow(row.id, { size: e.target.value })} /></div>
                                            <div className="col-span-5">
                                                {bx_measurementType === 'WEIGHT' && (
                                                    <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                                                        <button type="button" onClick={() => bx_setWeightUnits(prev => ({ ...prev, [row.id]: 'kg' }))} className={`px-2 py-1 text-xs ${((bx_weightUnits[row.id] || 'kg') === 'kg') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>kg</button>
                                                        <button type="button" onClick={() => bx_setWeightUnits(prev => ({ ...prev, [row.id]: 'g' }))} className={`px-2 py-1 text-xs ${((bx_weightUnits[row.id] || 'kg') === 'g') ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>g</button>
                                                    </div>
                                                )}
                                                <Input id={`bx_qty-${row.id}`} name={`quantity-${idx}`} type="number" placeholder={`Quantity (${bx_measurementType === 'PCS' ? 'pcs' : bx_measurementType === 'WEIGHT' ? (bx_weightUnits[row.id] || 'kg') : bx_measurementType === 'LENGTH' ? 'm' : bx_measurementType === 'VOLUME' ? 'l' : bx_measurementType === 'AREA' ? 'm2' : ''})`} value={row.quantity} onChange={(e) => bx_updateRow(row.id, { quantity: e.target.value })} />
                                                {bx_measurementType === 'WEIGHT' && row.quantity && Number(row.quantity) > 0 && (
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        {(bx_weightUnits[row.id] || 'kg') === 'kg' ? `${Math.round(Number(row.quantity) * 1000)} g will be saved` : `${(Number(row.quantity) / 1000).toFixed(3)} kg`}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-span-2 flex justify-end gap-2">
                                                <button type="button" onClick={() => bx_removeRow(row.id)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{t('modals.editBox.remove')}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button type="button" onClick={bx_addRow} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{t('modals.editBox.addSize')}</button>
                                    <button type="button" onClick={bx_resetSizes} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-200 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20">{t('forms.resetSizes')}</button>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('forms.stockAddsNote')}</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
                                    <button type="submit" disabled={bx_loading} aria-busy={bx_loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{bx_loading && <Spinner size={16} className="text-white" />}<span>{bx_loading ? tc('saving') : t('buttons.addBox')}</span></button>
                                </div>
                            </div>
                            {bx_message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{bx_message}</p>}
                        </form>
                    )}
                </div>
            </Modal>
        </>
    )
}
