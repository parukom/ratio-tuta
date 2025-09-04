'use client'
import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'
import Dropdown from '@/components/ui/Dropdown'
import toast from 'react-hot-toast'

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
}

export default function CreateItemButton({ teamId, onCreated }: Props) {
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
  const [measurementType, setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'>('PCS')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [tagsCSV, setTagsCSV] = useState('')
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
    setName(''); setSku(''); setPrice(''); setTaxRateBps('0'); setIsActive(true); setMeasurementType('PCS'); setStockQuantity('0'); setDescription(''); setColor(''); setBrand(''); setTagsCSV(''); setCategoryId(''); setCreatingCat(false); setNewCatName(''); setCatMsg('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
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
          measurementType,
          stockQuantity: Number(stockQuantity) || 0,
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
      setMessage('Item created')
      toast.success('Item created')
      onCreated?.(data)
      reset()
      setOpen(false)
    } catch {
      setMessage('Network error')
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function createCategoryInline() {
    if (!newCatName.trim()) { setCatMsg('Enter a name'); toast('Enter a name', { icon: '⚠️' }); return }
    setCatLoading(true); setCatMsg('')
    try {
      const r = await fetch('/api/item-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), ...(teamId ? { teamId } : {}) }),
      })
      const data = await r.json()
      if (!r.ok) { const err = data.error || 'Failed'; setCatMsg(err); toast.error(err); return }
      // refresh list and select created
      setCategories(prev => {
        const next = [...prev, { id: data.id, name: data.name }]
        next.sort((a, b) => a.name.localeCompare(b.name))
        return next
      })
      setCategoryId(data.id)
      setCreatingCat(false)
      setNewCatName('')
      toast.success('Category created')
    } catch {
      setCatMsg('Network error')
      toast.error('Network error')
    } finally { setCatLoading(false) }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
      >
        Create item
      </button>

      <Modal open={open} onClose={() => setOpen(false)} size="lg">
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-left sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Create an item</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Items are team-wide. You can assign them to places with quantities later.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <Input id="name" name="name" type="text" className="" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="sku" name="sku" type="text" className="" placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
          {/* Category selector with inline create */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <div className="inline-block">
              <Dropdown
                align="left"
                buttonLabel={categoryId ? (categories.find(c => c.id === categoryId)?.name ?? 'Category') : 'No category'}
                items={[{ key: '', label: 'No category' }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                onSelect={(key) => setCategoryId(key)}
              />
            </div>
            {!creatingCat ? (
              <div className="mt-2">
                <button type="button" onClick={() => { setCreatingCat(true); setCatMsg('') }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ Create new category</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <Input id="newCategory" name="newCategory" type="text" className="" placeholder="New category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                <button type="button" onClick={createCategoryInline} disabled={catLoading} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{catLoading ? 'Saving…' : 'Create'}</button>
              </div>
            )}
            {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="price" name="price" type="number" className="" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input id="pricePaid" name="pricePaid" type="number" className="" placeholder="Price paid (cost)" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} />
            <Input id="taxRateBps" name="taxRateBps" type="number" className="" placeholder="Tax (bps) e.g. 2100" value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement type</label>
              <div className="inline-block">
                <Dropdown
                  align="left"
                  buttonLabel={(
                    [
                      { key: 'PCS', label: 'Pieces' },
                      { key: 'WEIGHT', label: 'Weight' },
                      { key: 'LENGTH', label: 'Length' },
                      { key: 'VOLUME', label: 'Volume' },
                      { key: 'AREA', label: 'Area' },
                      { key: 'TIME', label: 'Time' },
                    ] as Array<{ key: typeof measurementType; label: string }>
                  ).find(o => o.key === measurementType)?.label || 'Select'}
                  items={[
                    { key: 'PCS', label: 'Pieces' },
                    { key: 'WEIGHT', label: 'Weight' },
                    { key: 'LENGTH', label: 'Length' },
                    { key: 'VOLUME', label: 'Volume' },
                    { key: 'AREA', label: 'Area' },
                    { key: 'TIME', label: 'Time' },
                  ]}
                  onSelect={(key) => setMeasurementType(key as typeof measurementType)}
                />
              </div>
            </div>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              className=""
              placeholder={
                measurementType === 'PCS' ? 'Initial stock (pcs)'
                  : measurementType === 'WEIGHT' ? 'Initial stock (kg)'
                    : measurementType === 'LENGTH' ? 'Initial stock (m)'
                      : measurementType === 'VOLUME' ? 'Initial stock (l)'
                        : measurementType === 'AREA' ? 'Initial stock (m2)'
                          : 'Initial stock (h)'
              }
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
            />
          </div>
          <Input id="description" name="description" type="text" className="" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="color" name="color" type="text" className="" placeholder="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} />
            <Input id="brand" name="brand" type="text" className="" placeholder="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <Input id="tags" name="tags" type="text" className="" placeholder="Tags (comma-separated)" value={tagsCSV} onChange={(e) => setTagsCSV(e.target.value)} />
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">Name and SKU must be unique per team.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-gray-100 dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">{loading ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
          {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
        </form>
      </Modal>
    </>
  )
}
