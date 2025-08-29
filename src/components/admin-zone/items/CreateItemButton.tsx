'use client'
import { useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'

type Props = {
  teamId?: string
  onCreated?: (item: {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    price: number
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
  const [taxRateBps, setTaxRateBps] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [measurementType, setMeasurementType] = useState<'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME'>('PCS')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [tagsCSV, setTagsCSV] = useState('')

  function reset() {
    setName(''); setSku(''); setPrice(''); setTaxRateBps('0'); setIsActive(true); setMeasurementType('PCS'); setStockQuantity('0'); setDescription(''); setColor(''); setBrand(''); setTagsCSV('')
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
          price: Number(price),
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
      if (!res.ok) { setMessage(data.error || 'Failed to create'); return }
      setMessage('Item created')
      onCreated?.(data)
      reset()
      setOpen(false)
    } catch {
      setMessage('Network error')
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
        Create item
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-left sm:mt-0 sm:text-left w-full">
            <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Create an item</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Items are team-wide. You can assign them to places with quantities later.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <Input id="name" name="name" type="text" className="" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="sku" name="sku" type="text" className="" placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="price" name="price" type="number" className="" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input id="taxRateBps" name="taxRateBps" type="number" className="" placeholder="Tax (bps) e.g. 2100" value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="measurementType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement type</label>
              <select
                id="measurementType"
                name="measurementType"
                value={measurementType}
                onChange={(e) => setMeasurementType(e.target.value as typeof measurementType)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="PCS">Pieces</option>
                <option value="WEIGHT">Weight</option>
                <option value="LENGTH">Length</option>
                <option value="VOLUME">Volume</option>
                <option value="AREA">Area</option>
                <option value="TIME">Time</option>
              </select>
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
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
              <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading ? 'Creating…' : 'Create'}</button>
            </div>
          </div>
          {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
        </form>
      </Modal>
    </>
  )
}
