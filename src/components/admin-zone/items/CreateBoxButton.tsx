'use client'
import { useState } from 'react'
import Modal from '@/components/modals/Modal'
import Input from '@/components/ui/Input'

type SizeRow = { id: string; size: string; quantity: string; sku?: string }

type Props = {
    teamId?: string
    defaultCategoryId?: string | null
    onDone?: () => void
}

export default function CreateBoxButton({ teamId, defaultCategoryId, onDone }: Props) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const [baseName, setBaseName] = useState('')
    const [color, setColor] = useState('')
    const [price, setPrice] = useState('')
    const [taxRateBps, setTaxRateBps] = useState('0')
    const [unit, setUnit] = useState('pcs')
    const [skuPrefix, setSkuPrefix] = useState('')
    const [sizes, setSizes] = useState<SizeRow[]>([
        { id: crypto.randomUUID(), size: '', quantity: '0' },
    ])

    function addRow() {
        setSizes(prev => [...prev, { id: crypto.randomUUID(), size: '', quantity: '0' }])
    }
    function removeRow(id: string) {
        setSizes(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
    }
    function updateRow(id: string, patch: Partial<SizeRow>) {
        setSizes(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r))
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
                categoryId: defaultCategoryId ?? undefined,
                price: Number(price),
                taxRateBps: Number(taxRateBps) || 0,
                unit: unit.trim() || 'pcs',
                skuPrefix: skuPrefix || null,
                sizes: sizes
                    .filter(s => s.size.trim() && Number(s.quantity) > 0)
                    .map(s => ({ size: s.size.trim(), quantity: Number(s.quantity), sku: (s.sku || '').trim() || null })),
            }
            const res = await fetch('/api/items/box', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) { setMessage(data.error || 'Failed to add box'); return }
            setMessage('Box added')
            setOpen(false)
            onDone?.()
            // reset
            setBaseName(''); setColor(''); setPrice(''); setTaxRateBps('0'); setUnit('pcs'); setSkuPrefix(''); setSizes([{ id: crypto.randomUUID(), size: '', quantity: '0' }])
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
                className="inline-flex items-center justify-center rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-xs hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-transparent dark:text-indigo-400 dark:hover:bg-indigo-500/10"
            >
                Add box
            </button>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add a box to warehouse</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create or update multiple size items in one go. All items share the same base name, color and price.</p>

                <form onSubmit={submit} className="mt-4 space-y-3">
                    <Input id="baseName" name="baseName" type="text" className="" placeholder="Base name e.g. Shoes" value={baseName} onChange={(e) => setBaseName(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id="color" name="color" type="text" className="" placeholder="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} />
                        <Input id="price" name="price" type="number" className="" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                        <Input id="tax" name="tax" type="number" className="" placeholder="Tax (bps)" value={taxRateBps} onChange={(e) => setTaxRateBps(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id="unit" name="unit" type="text" className="" placeholder="Unit (e.g. pcs)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                        <Input id="skuPrefix" name="skuPrefix" type="text" className="" placeholder="SKU prefix (optional)" value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} />
                        {/* spacer for layout */}
                        <div />
                    </div>

                    <div>
                        <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Sizes in the box</div>
                        <div className="space-y-2">
                            {sizes.map((row, idx) => (
                                <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                                    <div className="col-span-5"><Input id={`size-${row.id}`} name={`size-${idx}`} type="text" className="" placeholder="Size (e.g. 35)" value={row.size} onChange={(e) => updateRow(row.id, { size: e.target.value })} /></div>
                                    <div className="col-span-5"><Input id={`qty-${row.id}`} name={`quantity-${idx}`} type="number" className="" placeholder="Quantity" value={row.quantity} onChange={(e) => updateRow(row.id, { quantity: e.target.value })} /></div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button type="button" onClick={() => removeRow(row.id)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">
                            <button type="button" onClick={addRow} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">+ Add size</button>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">If an item for a size doesn’t exist, it will be created. Otherwise its stock will be increased.</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                            <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading ? 'Saving…' : 'Add box'}</button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </>
    )
}
