'use client'
import Modal from "@/components/modals/Modal"
import Dropdown from "@/components/ui/Dropdown"
import Input from "@/components/ui/Input"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

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
}


export function ItemRowActions({ item, onUpdate, onDelete }: {
    item: ItemRow;
    onUpdate: (
        id: string,
    patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'pricePaid' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'size' | 'brand' | 'tags' | 'categoryId'>>,
        opts?: { categoryName?: string | null }
    ) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
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
    const [description, setDescription] = useState(item.description ?? '')
    const [color, setColor] = useState(item.color ?? '')
    const [size, setSize] = useState(item.size ?? '')
    const [brand, setBrand] = useState(item.brand ?? '')
    const [tagsCSV, setTagsCSV] = useState((item.tags ?? []).join(', '))
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
            await onUpdate(item.id, {
                name: name.trim(),
                sku: sku.trim() || null,
                price: Number(price),
                pricePaid: Number(pricePaid) || 0,
                taxRateBps: Number(taxRateBps) || 0,
                isActive,
                measurementType: (measurementType ?? 'PCS'),
                stockQuantity: Number(stockQuantity) || 0,
                description: description.trim() || null,
                color: color.trim() || null,
                size: size.trim() || null,
                brand: brand.trim() || null,
                tags: tagsCSV.split(',').map(t => t.trim()).filter(Boolean),
                categoryId: nextCategoryId,
            }, { categoryName: nextCategoryName })
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
            await onDelete(item.id)
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
            <button onClick={() => setOpen(true)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Edit</button>
            <button onClick={() => setConfirmOpen(true)} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10">Delete</button>

            {/* Confirm deletion modal */}
            <Modal open={confirmOpen} onClose={() => (!loading && setConfirmOpen(false))} size="sm">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-500/10">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="mt-3 text-left sm:ml-4 sm:mt-0">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Delete item</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to delete “{item.name}”? This action cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={doDelete}
                        disabled={loading}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 sm:ml-3 sm:w-auto dark:bg-red-500 dark:hover:bg-red-400"
                    >
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(false)}
                        disabled={loading}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>

            <Modal open={open} onClose={() => setOpen(false)} size="lg">
                <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-left sm:mt-0 sm:text-left">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Edit item</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update item details. These settings affect the item across your team.</p>
                    </div>
                </div>
                <form onSubmit={submit} className="mt-4 space-y-3">
                    <Input id={`name-${item.id}`} name="name" type="text" className="" placeholder="Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                    <Input id={`sku-${item.id}`} name="sku" type="text" className="" placeholder="SKU (optional)" value={sku} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSku(e.target.value)} />
                    {/* Category selector with inline create */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <div className="inline-block">
                            <Dropdown
                                align="left"
                                buttonLabel={([
                                    { key: 'NONE', label: 'No category' },
                                    ...categories.map(c => ({ key: c.id, label: c.name }))
                                ] as Array<{ key: string; label: string }>).find(o => o.key === (categoryId || 'NONE'))?.label || 'No category'}
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
                                <Input id={`newCategory-${item.id}`} name="newCategory" type="text" className="" placeholder="New category name" value={newCatName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)} />
                                <button type="button" onClick={() => setCreatingCat(false)} className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!newCatName.trim()) { setCatMsg('Enter a name'); return }
                                        setCatLoading(true); setCatMsg('')
                                        try {
                                            const r = await fetch('/api/item-categories', {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() })
                                            })
                                            const data = await r.json()
                                            if (!r.ok) { setCatMsg(data.error || 'Failed'); return }
                                            setCategories(prev => { const next = [...prev, { id: data.id, name: data.name }]; next.sort((a, b) => a.name.localeCompare(b.name)); return next })
                                            setCategoryId(data.id)
                                            setCreatingCat(false)
                                            setNewCatName('')
                                        } catch { setCatMsg('Network error') } finally { setCatLoading(false) }
                                    }}
                                    disabled={catLoading}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                >
                                    {catLoading ? 'Saving…' : 'Create'}
                                </button>
                            </div>
                        )}
                        {catMsg && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{catMsg}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id={`price-${item.id}`} name="price" type="number" className="" placeholder="Price" value={price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)} />
                        <Input id={`pricePaid-${item.id}`} name="pricePaid" type="number" className="" placeholder="Price paid (cost)" value={pricePaid} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPricePaid(e.target.value)} />
                        <Input id={`tax-${item.id}`} name="tax" type="number" className="" placeholder="Tax (bps)" value={taxRateBps} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRateBps(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Measurement type</label>
                            <div className="inline-block">
                                <Dropdown
                                    align="left"
                                    buttonLabel={([
                                        { key: 'PCS', label: 'Pieces' },
                                        { key: 'WEIGHT', label: 'Weight' },
                                        { key: 'LENGTH', label: 'Length' },
                                        { key: 'VOLUME', label: 'Volume' },
                                        { key: 'AREA', label: 'Area' },
                                        { key: 'TIME', label: 'Time' },
                                    ] as Array<{ key: ItemRow['measurementType']; label: string }>).find(o => o.key === measurementType)?.label || 'Select'}
                                    items={[
                                        { key: 'PCS', label: 'Pieces' },
                                        { key: 'WEIGHT', label: 'Weight' },
                                        { key: 'LENGTH', label: 'Length' },
                                        { key: 'VOLUME', label: 'Volume' },
                                        { key: 'AREA', label: 'Area' },
                                        { key: 'TIME', label: 'Time' },
                                    ]}
                                    onSelect={(key) => setMeasurementType(key as ItemRow['measurementType'])}
                                />
                            </div>
                        </div>
                        <Input
                            id={`stock-${item.id}`}
                            name="stock"
                            type="number"
                            className=""
                            placeholder={
                                measurementType === 'PCS' ? 'Stock (pcs)'
                                    : measurementType === 'WEIGHT' ? 'Stock (kg)'
                                        : measurementType === 'LENGTH' ? 'Stock (m)'
                                            : measurementType === 'VOLUME' ? 'Stock (l)'
                                                : measurementType === 'AREA' ? 'Stock (m2)'
                                                    : 'Stock (h)'
                            }
                            value={stockQuantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockQuantity(e.target.value)}
                        />
                    </div>
                    <Input id={`desc-${item.id}`} name="description" type="text" className="" placeholder="Description (optional)" value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input id={`color-${item.id}`} name="color" type="text" className="" placeholder="Color (optional)" value={color} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)} />
                        <Input id={`size-${item.id}`} name="size" type="text" className="" placeholder="Size (optional)" value={size} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSize(e.target.value)} />
                        <Input id={`brand-${item.id}`} name="brand" type="text" className="" placeholder="Brand (optional)" value={brand} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)} />
                    </div>
                    <Input id={`tags-${item.id}`} name="tags" type="text" className="" placeholder="Tags (comma-separated)" value={tagsCSV} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsCSV(e.target.value)} />
                    <div className="flex items-center gap-2">
                        <input id={`active-${item.id}`} name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
                        <label htmlFor={`active-${item.id}`} className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Name and SKU must be unique per team.</div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">Cancel</button>
                            <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">{loading ? 'Saving…' : 'Save'}</button>
                        </div>
                    </div>
                    {message && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </Modal>
        </div>
    )
}
