'use client'
import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import ImageUploader from '@/components/ui/ImageUploader'
import Dropdown from '@/components/ui/Dropdown'
import toast from 'react-hot-toast'
import Spinner from '@/components/ui/Spinner'
import { useTranslations } from 'next-intl'

type Props = {
  teamId?: string
  onCreated?: (item: {
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
  }) => void
  // When true, this component will not fire a success toast on create.
  // Useful when the parent also shows a toast to avoid duplicates.
  suppressToast?: boolean
}

export default function CreateItemButton({ teamId, onCreated, suppressToast }: Props) {
  const t = useTranslations('Items')
  const tc = useTranslations('Common')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // form fields
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [pricePaid, setPricePaid] = useState('')
  const [taxRateBps, setTaxRateBps] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [measurementType, setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'>('PCS')
  const [stockQuantity, setStockQuantity] = useState('0')
  // For measurement items allow entering/editing in large or small units
  const [weightUnit, setWeightUnit] = useState<'kg' | 'g'>('kg')
  const [lengthUnit, setLengthUnit] = useState<'m' | 'cm'>('m')
  const [volumeUnit, setVolumeUnit] = useState<'l' | 'ml'>('l')
  const [areaUnit, setAreaUnit] = useState<'m²' | 'cm²'>('m²')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [tagsCSV, setTagsCSV] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  // categories
  type Category = { id: string; name: string }
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<string | ''>('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)
  const [catMsg, setCatMsg] = useState('')

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

  function reset() {
    setName(''); setSku(''); setPrice(''); setTaxRateBps('0'); setIsActive(true); setIsUnlimited(false); setMeasurementType('PCS'); setStockQuantity('0'); setWeightUnit('kg'); setLengthUnit('m'); setVolumeUnit('l'); setAreaUnit('m²'); setDescription(''); setColor(''); setBrand(''); setTagsCSV(''); setCategoryId(''); setCreatingCat(false); setNewCatName(''); setCatMsg(''); setImageFile(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      if (!imageFile) {
        setMessage(t('forms.pictureRequired'))
        toast(t('forms.pictureRequired'), { icon: '📷' })
        setLoading(false)
        return
      }
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(teamId ? { teamId } : {}),
          name,
          sku: sku || null,
          categoryId: categoryId || null,
          price: Number(price),
          pricePaid: Number(pricePaid) || 0,
          taxRateBps: Number(taxRateBps) || 0,
          isActive,
          isUnlimited,
          measurementType,
          // Convert to small units for storage
          stockQuantity: (() => {
            const v = Number(stockQuantity)
            if (!Number.isFinite(v) || v < 0) return 0
            if (measurementType === 'WEIGHT') {
              return Math.round(weightUnit === 'kg' ? v * 1000 : v)
            }
            if (measurementType === 'LENGTH') {
              return Math.round(lengthUnit === 'm' ? v * 100 : v)
            }
            if (measurementType === 'VOLUME') {
              return Math.round(volumeUnit === 'l' ? v * 1000 : v)
            }
            if (measurementType === 'AREA') {
              return Math.round(areaUnit === 'm²' ? v * 10000 : v)
            }
            return Math.round(v)
          })(),
          description: description.trim() || null,
          color: color.trim() || null,
          brand: brand.trim() || null,
          tags: tagsCSV
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) { const err = data.error || 'Failed to create'; setMessage(err); toast.error(err); return }
      let created = data
      // If an image file was selected, upload it now
      if (imageFile) {
        try {
          const fd = new FormData()
          fd.append('file', imageFile)
          const up = await fetch(`/api/items/${data.id}/image`, { method: 'POST', body: fd })
          const upData = await up.json()
          if (up.ok) {
            created = { ...data, imageUrl: upData.imageUrl }
          } else {
            toast.error(upData.error || 'Failed to upload image')
          }
        } catch {
          toast.error('Failed to upload image')
        }
      }
      setMessage(t('toasts.created'))
      if (!suppressToast) toast.success(t('toasts.created'))
      onCreated?.(created)
      reset()
      setOpen(false)
    } catch {
      setMessage(t('toasts.networkError'))
      toast.error(t('toasts.networkError'))
    } finally {
      setLoading(false)
    }
  }

  async function createCategoryInline() {
    if (!newCatName.trim()) { setCatMsg(t('forms.enterName')); toast(t('forms.enterName'), { icon: '⚠️' }); return }
    setCatLoading(true); setCatMsg('')
    try {
      const r = await fetch('/api/item-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), ...(teamId ? { teamId } : {}) }),
      })
      const data = await r.json()
      if (!r.ok) { const err = data.error || tc('errors.failed'); setCatMsg(err); toast.error(err); return }
      // refresh list and select created
      setCategories(prev => {
        const next = [...prev, { id: data.id, name: data.name }]
        next.sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      setCategoryId(data.id)
      setCreatingCat(false)
      setNewCatName('')
      toast.success(t('toasts.categoryCreated'))
    } catch {
      setCatMsg(t('toasts.networkError'))
      toast.error(t('toasts.networkError'))
    } finally { setCatLoading(false) }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
      >
        {tc('createItem')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} size="lg">
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-left sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">{t('modals.editItem.title')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('modals.editItem.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <ImageUploader
            id="create-item-image"
            label={t('forms.picture')}
            required
            value={imageFile}
            onChange={setImageFile}
            hint={t('forms.pictureHint')}
          />
          <Input id="name" name="name" type="text" className="" placeholder={tc('name')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="sku" name="sku" type="text" className="" placeholder={t('forms.sku')} value={sku} onChange={(e) => setSku(e.target.value)} />
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
                <Input id="newCategory" name="newCategory" type="text" className="" placeholder={t('forms.newCategoryName')} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">{tc('cancel')}</button>
                <button type="button" onClick={createCategoryInline} disabled={catLoading} className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{catLoading && <Spinner size={14} className="text-white" />}<span>{catLoading ? tc('saving') : tc('create')}</span></button>
              </div>
            )}
            {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="price"
              name="price"
              type="number"
              className=""
              placeholder={
                measurementType === 'WEIGHT' ? `${t('labels.price')} (per kg)`
                  : measurementType === 'LENGTH' ? `${t('labels.price')} (per m)`
                    : measurementType === 'VOLUME' ? `${t('labels.price')} (per l)`
                      : measurementType === 'AREA' ? `${t('labels.price')} (per m²)`
                        : t('labels.price')
              }
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input id="pricePaid" name="pricePaid" type="number" className="" placeholder={t('card.cost')} value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
            <Input id="taxRateBps" name="taxRateBps" type="number" className="" placeholder={`${t('labels.tax')} (bps)`} value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
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
                    ] as Array<{ key: typeof measurementType; label: string }>
                  ).find(o => o.key === measurementType)?.label || t('forms.select')}
                  items={[
                    { key: 'PCS', label: t('forms.measurementOptions.PCS') },
                    { key: 'WEIGHT', label: t('forms.measurementOptions.WEIGHT') },
                    { key: 'LENGTH', label: t('forms.measurementOptions.LENGTH') },
                    { key: 'VOLUME', label: t('forms.measurementOptions.VOLUME') },
                    { key: 'AREA', label: t('forms.measurementOptions.AREA') },
                  ]}
                  onSelect={(key) => {
                    setMeasurementType(key as typeof measurementType)
                    if (key !== 'WEIGHT') setWeightUnit('kg')
                    if (key !== 'LENGTH') setLengthUnit('m')
                    if (key !== 'VOLUME') setVolumeUnit('l')
                    if (key !== 'AREA') setAreaUnit('m²')
                  }}
                />
              </div>
            </div>
            <div>
              {measurementType === 'WEIGHT' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                  <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                    <button type="button" onClick={() => setWeightUnit('kg')} className={`px-2 py-1 text-xs ${weightUnit === 'kg' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>kg</button>
                    <button type="button" onClick={() => setWeightUnit('g')} className={`px-2 py-1 text-xs ${weightUnit === 'g' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>g</button>
                  </div>
                </div>
              )}
              {measurementType === 'LENGTH' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                  <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                    <button type="button" onClick={() => setLengthUnit('m')} className={`px-2 py-1 text-xs ${lengthUnit === 'm' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m</button>
                    <button type="button" onClick={() => setLengthUnit('cm')} className={`px-2 py-1 text-xs ${lengthUnit === 'cm' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm</button>
                  </div>
                </div>
              )}
              {measurementType === 'VOLUME' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                  <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                    <button type="button" onClick={() => setVolumeUnit('l')} className={`px-2 py-1 text-xs ${volumeUnit === 'l' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>l</button>
                    <button type="button" onClick={() => setVolumeUnit('ml')} className={`px-2 py-1 text-xs ${volumeUnit === 'ml' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>ml</button>
                  </div>
                </div>
              )}
              {measurementType === 'AREA' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forms.unit')}</label>
                  <div className="mb-1 inline-flex rounded-md shadow-xs ring-1 ring-inset ring-gray-300 dark:ring-white/10">
                    <button type="button" onClick={() => setAreaUnit('m²')} className={`px-2 py-1 text-xs ${areaUnit === 'm²' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 dark:bg-transparent dark:text-gray-300'}`}>m²</button>
                    <button type="button" onClick={() => setAreaUnit('cm²')} className={`px-2 py-1 text-xs ${areaUnit === 'cm²' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-l border-gray-200 dark:bg-transparent dark:text-gray-300 dark:border-white/10'}`}>cm²</button>
                  </div>
                </div>
              )}
              <Input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                className=""
                placeholder={
                  measurementType === 'PCS' ? t('forms.initialStock.PCS')
                    : measurementType === 'WEIGHT' ? `Stock (${weightUnit})`
                      : measurementType === 'LENGTH' ? `Stock (${lengthUnit})`
                        : measurementType === 'VOLUME' ? `Stock (${volumeUnit})`
                          : measurementType === 'AREA' ? `Stock (${areaUnit})`
                            : t('forms.initialStock.PCS')
                }
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
              {measurementType === 'WEIGHT' && stockQuantity && Number(stockQuantity) > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {weightUnit === 'kg' ? `${Math.round(Number(stockQuantity) * 1000)} g will be saved` : `${(Number(stockQuantity) / 1000).toFixed(3)} kg`}
                </p>
              )}
              {measurementType === 'LENGTH' && stockQuantity && Number(stockQuantity) > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {lengthUnit === 'm' ? `${Math.round(Number(stockQuantity) * 100)} cm will be saved` : `${(Number(stockQuantity) / 100).toFixed(2)} m`}
                </p>
              )}
              {measurementType === 'VOLUME' && stockQuantity && Number(stockQuantity) > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {volumeUnit === 'l' ? `${Math.round(Number(stockQuantity) * 1000)} ml will be saved` : `${(Number(stockQuantity) / 1000).toFixed(3)} l`}
                </p>
              )}
              {measurementType === 'AREA' && stockQuantity && Number(stockQuantity) > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {areaUnit === 'm²' ? `${Math.round(Number(stockQuantity) * 10000)} cm² will be saved` : `${(Number(stockQuantity) / 10000).toFixed(2)} m²`}
                </p>
              )}
            </div>
          </div>
          <Input id="description" name="description" type="text" className="" placeholder={t('forms.descriptionOptional')} value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="color" name="color" type="text" className="" placeholder={t('forms.colorOptional')} value={color} onChange={(e) => setColor(e.target.value)} />
            <Input id="brand" name="brand" type="text" className="" placeholder={t('forms.brandOptional')} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <Input id="tags" name="tags" type="text" className="" placeholder={t('forms.tagsComma')} value={tagsCSV} onChange={(e) => setTagsCSV(e.target.value)} />
          {/* Image upload handled by ImageUploader above */}
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">{t('forms.active')}</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="isUnlimited" name="isUnlimited" type="checkbox" checked={isUnlimited} onChange={(e) => setIsUnlimited(e.target.checked)} className="size-4" />
            <label htmlFor="isUnlimited" className="text-sm text-gray-700 dark:text-gray-300">Unlimited Quantity (∞)</label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('forms.uniqueNote')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">{tc('cancel')}</button>
              <button type="submit" disabled={loading} aria-busy={loading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text:white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{loading && <Spinner size={16} className="text-white" />}<span>{loading ? tc('creating') : tc('create')}</span></button>
            </div>
          </div>
          {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
        </form>
      </Modal>
    </>
  )
}
