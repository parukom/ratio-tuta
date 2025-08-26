'use client'
import { useEffect, useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'

type Place = { id: number; name: string }

type Props = {
  teamId?: number
  onCreated?: (item: { id: number; name: string; placeId: number }) => void
}

export default function CreateItemButton({ teamId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // form fields
  const [placeId, setPlaceId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [taxRateBps, setTaxRateBps] = useState('0')
  const [isActive, setIsActive] = useState(true)

  const [places, setPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)

  function reset() {
    setPlaceId(''); setName(''); setSku(''); setPrice(''); setTaxRateBps('0'); setIsActive(true)
  }

  useEffect(() => {
    if (!open) return
    setLoadingPlaces(true)
    const qp = teamId ? `?teamId=${teamId}` : ''
    fetch(`/api/places${qp}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: any[]) => setPlaces(data))
      .catch(() => setPlaces([]))
      .finally(() => setLoadingPlaces(false))
  }, [open, teamId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: Number(placeId),
          name,
          sku: sku || null,
          price: Number(price),
          taxRateBps: Number(taxRateBps) || 0,
          isActive,
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
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Fill in details for the new item.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm/6 font-medium text-gray-900 dark:text-white">Place</label>
            <div className="mt-2">
              <select
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="" disabled>{loadingPlaces ? 'Loading places…' : 'Select a place'}</option>
                {places.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <Input id="name" name="name" type="text" className="" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="sku" name="sku" type="text" className="" placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="price" name="price" type="number" className="" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input id="taxRateBps" name="taxRateBps" type="number" className="" placeholder="Tax (bps) e.g. 2100" value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">Name and SKU must be unique per place.</p>
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
