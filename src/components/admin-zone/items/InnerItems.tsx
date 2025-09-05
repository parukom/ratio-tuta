"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import CreateBoxButton from "./CreateBoxButton"
import CreateItemButton from "./CreateItemButton"
import { ConflictModal } from "./ConflictModal"
import { LayoutGrid, Table as TableIcon, RotateCcw } from "lucide-react"
import Dropdown from "@/components/ui/Dropdown"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/ui/SearchInput"
import Modal from "@/components/modals/Modal"
import ItemsTableView from "./ItemsTableView"
import ItemsCardsView from "./ItemsCardsView"
import type { ItemRow, Group } from "./types"

// ItemRow and Group types moved to ./types for reuse across components

export default function InnerItems() {
    // filters/sort/view
    // Stable SSR-safe defaults to prevent hydration mismatches; load persisted values on mount
    const [q, setQ] = useState("")
    const [onlyActive, setOnlyActive] = useState<boolean>(false)
    const [categoryId, setCategoryId] = useState<string>("")
    const [measurementType, setMeasurementType] = useState<"" | ItemRow["measurementType"]>("")
    const [inStock, setInStock] = useState<boolean>(false)
    const [minPrice, setMinPrice] = useState<string>("")
    const [maxPrice, setMaxPrice] = useState<string>("")
    const [sort, setSort] = useState<string>("createdAt_desc")
    const [view, setView] = useState<"cards" | "table">("cards")
    const [grouped, setGrouped] = useState<boolean>(true)
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

    // Load persisted state from localStorage after mount (client-only)
    useEffect(() => {
        try {
            setQ(localStorage.getItem("items:q") || "")
            const vOnlyActive = localStorage.getItem("items:onlyActive")
            setOnlyActive(vOnlyActive === "1" || vOnlyActive === "true")
            setCategoryId(localStorage.getItem("items:categoryId") || "")
            const vMT = localStorage.getItem("items:measurementType") as ItemRow["measurementType"] | "" | null
            const allowed = ["PCS", "WEIGHT", "LENGTH", "VOLUME", "AREA", "TIME"] as const
            setMeasurementType(vMT && (allowed as readonly string[]).includes(vMT) ? vMT : "")
            const vInStock = localStorage.getItem("items:inStock")
            setInStock(vInStock === "1" || vInStock === "true")
            setMinPrice(localStorage.getItem("items:minPrice") || "")
            setMaxPrice(localStorage.getItem("items:maxPrice") || "")
            const vSort = localStorage.getItem("items:sort") || "createdAt_desc"
            setSort(vSort)
            const vView = localStorage.getItem("items:view") as "cards" | "table" | null
            setView(vView === "cards" || vView === "table" ? vView : "cards")
            const g = localStorage.getItem("items:grouped")
            setGrouped(g === null ? true : g === "1")
            const og = localStorage.getItem("items:openGroups")
            setOpenGroups(og ? JSON.parse(og) : {})
        } catch { /* noop */ }
    }, [])

    // data
    const [items, setItems] = useState<ItemRow[]>([])
    const [loading, setLoading] = useState(false)
    const [conflictInfo, setConflictInfo] = useState<null | { id: string; places: { placeId: string; placeName: string; quantity: number }[] }>(null)
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    // Deleting a whole box (group)
    const [confirmBoxKey, setConfirmBoxKey] = useState<string | null>(null)
    const [deletingBox, setDeletingBox] = useState(false)
    const [boxMsg, setBoxMsg] = useState("")
    // Edit box modal
    const [editBoxKey, setEditBoxKey] = useState<string | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editMsg, setEditMsg] = useState("")
    const [editImage, setEditImage] = useState<File | null>(null)
    const [editPrice, setEditPrice] = useState<string>("")
    const [editBoxCost, setEditBoxCost] = useState<string>("")
    const [editTaxBps, setEditTaxBps] = useState<string>("")
    type EditRow = { id: string; size: string; quantity: string; itemId?: string }
    const genId = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const [editRows, setEditRows] = useState<EditRow[]>([])
    function addEditRow() { setEditRows((p) => [...p, { id: genId(), size: "", quantity: "0" }]) }
    function removeEditRow(id: string) { setEditRows((p) => p.filter(r => r.id !== id)) }
    function updateEditRow(id: string, patch: Partial<EditRow>) { setEditRows((p) => p.map(r => r.id === id ? { ...r, ...patch } : r)) }

    useEffect(() => { try { localStorage.setItem("items:view", view) } catch { } }, [view])
    useEffect(() => { try { localStorage.setItem("items:grouped", grouped ? "1" : "0") } catch { } }, [grouped])
    useEffect(() => { try { localStorage.setItem("items:openGroups", JSON.stringify(openGroups)) } catch { } }, [openGroups])
    useEffect(() => { try { localStorage.setItem("items:sort", sort) } catch { } }, [sort])
    // persist filters
    useEffect(() => { try { localStorage.setItem("items:q", q) } catch { } }, [q])
    useEffect(() => { try { localStorage.setItem("items:onlyActive", onlyActive ? "1" : "0") } catch { } }, [onlyActive])
    useEffect(() => { try { localStorage.setItem("items:categoryId", categoryId) } catch { } }, [categoryId])
    useEffect(() => { try { localStorage.setItem("items:measurementType", measurementType || "") } catch { } }, [measurementType])
    useEffect(() => { try { localStorage.setItem("items:inStock", inStock ? "1" : "0") } catch { } }, [inStock])
    useEffect(() => { try { localStorage.setItem("items:minPrice", minPrice) } catch { } }, [minPrice])
    useEffect(() => { try { localStorage.setItem("items:maxPrice", maxPrice) } catch { } }, [maxPrice])

    // categories
    useEffect(() => {
        let active = true
            ; (async () => {
                try {
                    const r = await fetch(`/api/item-categories?onlyActive=true`)
                    if (!r.ok) return
                    const data: unknown = await r.json()
                    if (!active) return
                    let list: Category[] = []
                    if (Array.isArray(data)) {
                        list = data.map((c) => {
                            const rec = c as Record<string, unknown>
                            return { id: String(rec.id ?? ""), name: String(rec.name ?? "") }
                        })
                    }
                    setCategories(list)
                } catch { }
            })()
        return () => { active = false }
    }, [])

    // fetch items
    useEffect(() => {
        setLoading(true)
        const t = setTimeout(() => { fetchItems() }, 250)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, onlyActive, categoryId, measurementType, inStock, minPrice, maxPrice, sort])

    async function fetchItems() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (q) params.set("q", q)
            if (onlyActive) params.set("onlyActive", "1")
            if (categoryId) params.set("categoryId", categoryId)
            if (measurementType) params.set("measurementType", measurementType)
            if (inStock) params.set("inStock", "1")
            if (minPrice) params.set("minPrice", minPrice)
            if (maxPrice) params.set("maxPrice", maxPrice)
            const sortMap: Record<string, string> = {
                createdAt_desc: "createdat_desc",
                createdAt_asc: "createdat_asc",
                name_asc: "name_asc",
                name_desc: "name_desc",
                price_asc: "price_asc",
                price_desc: "price_desc",
                stock_asc: "stock_asc",
                stock_desc: "stock_desc",
                tax_asc: "tax_asc",
                tax_desc: "tax_desc",
            }
            params.set("sort", sortMap[sort] || "createdat_desc")
            const res = await fetch(`/api/items?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch items")
            const data: ItemRow[] = await res.json()
            setItems(data)
        } catch (e) {
            console.error(e)
            toast.error("Failed to load items")
        } finally { setLoading(false) }
    }

    // Delete a whole box (group)
    async function deleteBoxByGroupKey(groupKey: string) {
        // groupKey format: `${teamId}|${baseLabel}|${color || ""}`
        const [teamId, baseLabel, color] = groupKey.split("|")
        // Normalize baseName expected by API: strip trailing ` (Color)` if present
        let baseName = baseLabel
        if (color && baseLabel.endsWith(` (${color})`)) {
            baseName = baseLabel.slice(0, -(` (${color})`).length)
        }

        setDeletingBox(true); setBoxMsg("")
        try {
            const res = await fetch(`/api/items/box`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId, baseName, color: color || null }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) { throw new Error(data?.error || "Failed to delete box") }

            // Optimistically remove items from this group
            setItems((prev) => prev.filter((it) => {
                const base = (it.name || "").split(" - ")[0] || it.name
                const key = `${it.teamId}|${base}|${it.color || ""}`
                return key !== groupKey
            }))
            toast.success("Box deleted")
            setConfirmBoxKey(null)
        } catch (e) {
            console.error(e)
            setBoxMsg((e as Error)?.message || "Failed to delete box")
            toast.error("Failed to delete box")
        } finally {
            setDeletingBox(false)
        }
    }

    // create callback
    function onCreated(created: Partial<ItemRow> & { id: string; teamId: string; name: string; price: number; pricePaid?: number; taxRateBps: number; isActive: boolean; createdAt: string }) {
        if (!onlyActive || created.isActive) {
            const optimistic: ItemRow = {
                id: created.id,
                teamId: created.teamId,
                name: created.name,
                sku: created.sku ?? null,
                categoryId: created.categoryId ?? null,
                categoryName: created.categoryName ?? null,
                price: created.price,
                taxRateBps: created.taxRateBps,
                pricePaid: created.pricePaid ?? 0,
                isActive: created.isActive,
                unit: created.unit ?? "pcs",
                stockQuantity: created.stockQuantity ?? 0,
                createdAt: created.createdAt,
                currency: created.currency ?? "EUR",
                measurementType: (created.measurementType as ItemRow["measurementType"]) ?? "PCS",
                description: created.description ?? null,
                color: created.color ?? null,
                size: created.size ?? null,
                brand: created.brand ?? null,
                tags: created.tags ?? null,
                imageUrl: created.imageUrl ?? null,
            }
            setItems((prev) => [optimistic, ...prev.filter((i) => i.id !== optimistic.id)])
        }
        toast.success("Item created")
        fetchItems()
    }

    // update/delete helpers
    async function updateItem(id: string, patch: Partial<Pick<ItemRow, "name" | "sku" | "price" | "pricePaid" | "taxRateBps" | "isActive" | "measurementType" | "stockQuantity" | "description" | "color" | "size" | "brand" | "tags" | "categoryId">>, opts?: { categoryName?: string | null }) {
        const res = await fetch(`/api/items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) })
        if (!res.ok) throw new Error("Failed to update")
        const updated: ItemRow = await res.json()
        setItems((prev) => prev.map((it) => {
            if (it.id !== id) return it
            const next: ItemRow = { ...it, ...updated }
            if (opts && "categoryName" in (opts || {})) next.categoryName = opts.categoryName ?? null
            return next
        }))
        toast.success("Item updated")
    }
    async function deleteItem(id: string) {
        const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
        if (res.status === 409) {
            try {
                const r2 = await fetch(`/api/items/${id}/places`)
                const data = await r2.json()
                setConflictInfo({ id, places: Array.isArray(data) ? data : [] })
            } catch { setConflictInfo({ id, places: [] }) }
            toast("Item is assigned to places", { icon: "⚠️" })
            return
        }
        if (!res.ok) throw new Error("Failed to delete")
        setItems((prev) => prev.filter((it) => it.id !== id))
        toast.success("Item deleted")
    }

    // grouping
    const groups = useMemo(() => {
        const map = new Map<string, Group>()
        for (const it of items) {
            const base = (it.name || "").split(" - ")[0] || it.name
            const key = `${it.teamId}|${base}|${it.color || ""}`
            const stock = typeof it.stockQuantity === "number" ? it.stockQuantity : 0
            const existing = map.get(key)
            if (!existing) {
                map.set(key, { key, label: base, color: it.color ?? null, imageUrl: it.imageUrl ?? null, categoryName: it.categoryName ?? null, price: it.price, pricePaid: it.pricePaid ?? 0, taxRateBps: it.taxRateBps, unit: it.unit ?? null, brand: it.brand ?? null, items: [it], totalStock: stock ?? 0 })
            } else {
                existing.items.push(it)
                existing.totalStock += stock ?? 0
                if (!existing.imageUrl && it.imageUrl) existing.imageUrl = it.imageUrl
            }
        }
        return Array.from(map.values())
    }, [items])
    function expandAllGroups() { const all: Record<string, boolean> = {}; for (const g of groups) all[g.key] = true; setOpenGroups(all) }
    function collapseAllGroups() { const all: Record<string, boolean> = {}; for (const g of groups) all[g.key] = false; setOpenGroups(all) }

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">Items</h1>
                <div className="flex items-center gap-2">
                    <CreateBoxButton onDone={fetchItems} />
                    <CreateItemButton onCreated={onCreated} />
                </div>
            </div>

            <header className="sticky top-0 z-10 mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-xs dark:border-white/10 dark:bg-gray-900">
                <div className="flex flex-col gap-4">
                    <header className="w-full flex gap-4 flex-wrap">

                        <div className="ml-auto flex items-center gap-1 rounded-md bg-gray-50 p-1 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
                            <button type="button" onClick={() => setView("cards")} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${view === "cards" ? "bg-white text-gray-900 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-white/10" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`} title="Cards view"><LayoutGrid className="size-3.5" /> </button>
                            <button type="button" onClick={() => setView("table")} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${view === "table" ? "bg-white text-gray-900 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-white/10" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`} title="Table view"><TableIcon className="size-3.5" /> </button>
                        </div>

                        <div className="relative min-w-56 flex-1">
                            <SearchInput
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by name or SKU"
                                containerClassName=""
                                inputClassName="block w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 sm:text-sm/6"
                            />
                        </div>

                        <div className="inline-block">
                            <Dropdown
                                align="left"
                                buttonLabel={categoryId ? (categories.find(c => c.id === categoryId)?.name ?? "All categories") : "All categories"}
                                items={[{ key: "", label: "All categories" }, ...categories.map(c => ({ key: c.id, label: c.name }))]}
                                onSelect={(key) => setCategoryId(key)}
                            />
                        </div>

                        <label className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 ring-1 ring-inset ring-gray-300 dark:text-gray-300 dark:ring-white/10">
                            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                            In stock
                        </label>
                    </header>


                    <footer className="flex gap-4 flex-wrap">


                        <div className="flex items-center gap-1">
                            <div className="w-24">
                                <Input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    placeholder="Min €"
                                    className="px-2"
                                    hideLabel
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="w-24">
                                <Input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    placeholder="Max €"
                                    className="px-2"
                                    hideLabel
                                />
                            </div>
                        </div>
                        {(() => {
                            const sortOptions = [
                                { key: "createdAt_desc", label: "Newest" },
                                { key: "createdAt_asc", label: "Oldest" },
                                { key: "name_asc", label: "Name A-Z" },
                                { key: "name_desc", label: "Name Z-A" },
                                { key: "price_asc", label: "Price ↑" },
                                { key: "price_desc", label: "Price ↓" },
                                { key: "stock_asc", label: "Stock ↑" },
                                { key: "stock_desc", label: "Stock ↓" },
                                { key: "tax_asc", label: "Tax ↑" },
                                { key: "tax_desc", label: "Tax ↓" },
                            ]
                            const current = sortOptions.find(o => o.key === sort)?.label ?? "Sort"
                            return (
                                <div className="inline-block" title="Sort">
                                    <Dropdown
                                        align="left"
                                        buttonLabel={current}
                                        items={sortOptions}
                                        onSelect={(key) => setSort(key)}
                                    />
                                </div>
                            )
                        })()}
                        <button type="button" onClick={() => { setQ(""); setOnlyActive(false); setCategoryId(""); setMeasurementType(""); setInStock(false); setMinPrice(""); setMaxPrice(""); setSort("createdAt_desc") }} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5" title="Reset filters">
                            <RotateCcw className="size-3.5" /> Reset
                        </button>

                    </footer>
                </div>
                <div className="mt-2 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />Active only</label>
                    {view === "cards" && (
                        <div className="ml-2 flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} />Group by box</label>
                            {grouped && (
                                <div className="flex items-center gap-1">
                                    <button type="button" onClick={expandAllGroups} className="rounded px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5">Expand all</button>
                                    <button type="button" onClick={collapseAllGroups} className="rounded px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/5">Collapse all</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Views */}
            {view === "table" ? (
                <ItemsTableView items={items} loading={loading} onUpdate={updateItem} onDelete={deleteItem} />
            ) : (
                <ItemsCardsView
                    items={items}
                    groups={groups}
                    grouped={grouped}
                    loading={loading}
                    openGroups={openGroups}
                    setOpenGroups={(updater) => setOpenGroups(updater(openGroups))}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                    onAskDeleteBox={(key) => setConfirmBoxKey(key)}
                    onAskEditBox={(key) => {
                        setEditMsg("")
                        setEditBoxKey(key)
                        // seed with group data
                        const g = groups.find(g => g.key === key)
                        if (g) {
                            setEditPrice(String(g.price))
                            setEditTaxBps(String(g.taxRateBps))
                            setEditBoxCost("")
                            const rows: EditRow[] = g.items.map(it => ({ id: genId(), size: it.size || "", quantity: "0", itemId: it.id }))
                            setEditRows(rows)
                        } else {
                            setEditRows([{ id: genId(), size: "", quantity: "0" }])
                        }
                    }}
                />
            )}

            <ConflictModal info={conflictInfo} onClose={() => setConflictInfo(null)} />

            {/* Confirm delete box modal */}
            <Modal open={!!confirmBoxKey} onClose={() => (!deletingBox && setConfirmBoxKey(null))} size="sm">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-500/10">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <div className="mt-3 text-left sm:ml-4 sm:mt-0">
                        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Delete box</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This will remove all items in this box from your catalog and from places. Existing receipts remain intact.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={() => confirmBoxKey && deleteBoxByGroupKey(confirmBoxKey)}
                        disabled={deletingBox}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60 sm:ml-3 sm:w-auto dark:bg-red-500 dark:hover:bg-red-400"
                    >
                        {deletingBox ? 'Deleting…' : 'Delete box'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmBoxKey(null)}
                        disabled={deletingBox}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                </div>
                {boxMsg && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{boxMsg}</p>}
            </Modal>

            {/* Edit box modal */}
            <Modal open={!!editBoxKey} onClose={() => (!editLoading && setEditBoxKey(null))} size="lg">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit box</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Adjust price/tax, add quantities per size, and optionally split a total box cost across added quantities. To remove a size, set a negative quantity to decrease stock or use delete on individual items.</p>
                <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input type="number" placeholder="Price" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                        <Input type="number" placeholder="Box cost to split (optional)" value={editBoxCost} onChange={(e) => setEditBoxCost(e.target.value)} />
                        <Input type="number" placeholder="Tax (bps)" value={editTaxBps} onChange={(e) => setEditTaxBps(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Replace box picture (applies to all items)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditImage(e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional. If provided, the image will be applied to all items in this box.</p>
                    </div>
                    <div>
                        <div className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-200">Sizes in the box</div>
                        <div className="space-y-2">
                            {editRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                                    <div className="col-span-6"><Input type="text" placeholder="Variant/Size" value={row.size} onChange={(e) => updateEditRow(row.id, { size: e.target.value })} /></div>
                                    <div className="col-span-4"><Input type="number" placeholder="Quantity (can be negative)" value={row.quantity} onChange={(e) => updateEditRow(row.id, { quantity: e.target.value })} /></div>
                                    <div className="col-span-2 flex justify-end"><button type="button" onClick={() => removeEditRow(row.id)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">Remove</button></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2"><button type="button" onClick={addEditRow} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">+ Add size</button></div>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => setEditBoxKey(null)} disabled={editLoading} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">Cancel</button>
                    <button
                        type="button"
                        disabled={editLoading}
                        onClick={async () => {
                            if (!editBoxKey) return
                            setEditLoading(true); setEditMsg("")
                            try {
                                // Parse groupKey
                                const [teamId, baseLabel, color] = editBoxKey.split("|")
                                let baseName = baseLabel
                                if (color && baseLabel.endsWith(` (${color})`)) {
                                    baseName = baseLabel.slice(0, -(` (${color})`).length)
                                }
                                // Build sizes for API: only positive quantities allowed by API; we’ll send adds via box API
                                const adds = editRows.filter(r => r.size.trim() && Number(r.quantity) !== 0 && Number(r.quantity) > 0)
                                    .map(r => ({ size: r.size.trim(), quantity: Number(r.quantity) }))
                                // Send sizes update and/or image replacement
                                if (adds.length || editImage) {
                                    let res: Response
                                    if (editImage) {
                                        const fd = new FormData()
                                        fd.append('payload', JSON.stringify({ teamId, baseName, color: color || null, price: Number(editPrice) || 0, boxCost: Number(editBoxCost) || 0, taxRateBps: Number(editTaxBps) || 0, measurementType: 'PCS', skuPrefix: null, sizes: adds, createMissing: true, isActive: true }))
                                        fd.append('file', editImage)
                                        res = await fetch('/api/items/box', { method: 'POST', body: fd })
                                    } else {
                                        res = await fetch('/api/items/box', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ teamId, baseName, color: color || null, price: Number(editPrice) || 0, boxCost: Number(editBoxCost) || 0, taxRateBps: Number(editTaxBps) || 0, measurementType: 'PCS', skuPrefix: null, sizes: adds, createMissing: true, isActive: true }),
                                        })
                                    }
                                    const data = await res.json().catch(() => ({}))
                                    if (!res.ok) throw new Error(data?.error || 'Failed to update box')
                                }
                                // Handle negative quantities: apply as per-item decrements via PATCH
                                const negs = editRows.filter(r => r.itemId && r.size.trim() && Number(r.quantity) < 0)
                                for (const r of negs) {
                                    const it = items.find(i => i.id === r.itemId)
                                    if (!it) continue
                                    const newStock = Math.max(0, (it.stockQuantity || 0) + Number(r.quantity))
                                    // Note: this does not adjust pricePaid; it's a stock correction
                                    await updateItem(it.id, { stockQuantity: newStock })
                                }
                                toast.success('Box updated')
                                setEditBoxKey(null)
                                setEditImage(null)
                                fetchItems()
                            } catch (e) {
                                setEditMsg((e as Error)?.message || 'Failed to update box')
                                toast.error('Failed to update box')
                            } finally { setEditLoading(false) }
                        }}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >{editLoading ? 'Saving…' : 'Save changes'}</button>
                </div>
                {editMsg && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{editMsg}</p>}
            </Modal>
        </>
    )
}