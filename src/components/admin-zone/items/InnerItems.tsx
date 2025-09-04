"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import CreateBoxButton from "./CreateBoxButton"
import CreateItemButton from "./CreateItemButton"
import TableSkeleton from "@/components/ui/TableSkeleton"
import { ItemRowActions } from "./ItemRowActions"
import { ConflictModal } from "./ConflictModal"
import LoadingCards from "@/components/ui/LoadingCards"
import ItemCard from "./ItemCard"
import { ChevronDown, ChevronRight, LayoutGrid, Table as TableIcon, RotateCcw } from "lucide-react"
import Dropdown from "@/components/ui/Dropdown"
import Input from "@/components/ui/Input"
import SearchInput from "@/components/ui/SearchInput"

export type ItemRow = {
    id: string
    teamId: string
    name: string
    sku?: string | null
    categoryId?: string | null
    categoryName?: string | null
    price: number
    taxRateBps: number
    isActive: boolean
    unit?: string
    measurementType?: "PCS" | "WEIGHT" | "LENGTH" | "VOLUME" | "AREA" | "TIME"
    stockQuantity?: number
    createdAt: string
    currency: string
    description?: string | null
    color?: string | null
    size?: string | null
    brand?: string | null
    tags?: string[] | null
}

type Group = {
    key: string
    label: string
    color?: string | null
    categoryName?: string | null
    price: number
    taxRateBps: number
    unit?: string | null
    brand?: string | null
    items: ItemRow[]
    totalStock: number
}

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

    // create callback
    function onCreated(created: Partial<ItemRow> & { id: string; teamId: string; name: string; price: number; taxRateBps: number; isActive: boolean; createdAt: string }) {
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
            }
            setItems((prev) => [optimistic, ...prev.filter((i) => i.id !== optimistic.id)])
        }
        toast.success("Item created")
        fetchItems()
    }

    // update/delete helpers
    async function updateItem(id: string, patch: Partial<Pick<ItemRow, "name" | "sku" | "price" | "taxRateBps" | "isActive" | "measurementType" | "stockQuantity" | "description" | "color" | "size" | "brand" | "tags" | "categoryId">>, opts?: { categoryName?: string | null }) {
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
                map.set(key, { key, label: base, color: it.color ?? null, categoryName: it.categoryName ?? null, price: it.price, taxRateBps: it.taxRateBps, unit: it.unit ?? null, brand: it.brand ?? null, items: [it], totalStock: stock ?? 0 })
            } else {
                existing.items.push(it)
                existing.totalStock += stock ?? 0
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
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Item</th>
                                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">SKU</th>
                                <th className="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Category</th>
                                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Price</th>
                                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Tax</th>
                                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Unit</th>
                                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Stock</th>
                                <th className="px-2 py-2 text-right font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <TableSkeleton rows={8} columnWidths={["w-56", "w-36", "w-24", "w-24", "w-16", "w-20", "w-20", "w-40"]} />
                        ) : items.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-300">No items found.</td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {items.map((it) => (
                                    <tr key={it.id} className={!it.isActive ? "opacity-60" : ""}>
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900 dark:text-white">{it.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">#{it.id}</div>
                                        </td>
                                        <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.sku || "—"}</td>
                                        <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{it.categoryName || "—"}</td>
                                        <td className="px-2 py-2 text-right text-gray-900 dark:text-white">{new Intl.NumberFormat(undefined, { style: "currency", currency: it.currency || "EUR" }).format(it.price)}</td>
                                        <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{(it.taxRateBps / 100).toFixed(2)}%</td>
                                        <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{it.unit || "pcs"}</td>
                                        <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300">{typeof it.stockQuantity === "number" ? it.stockQuantity : "0"}</td>
                                        <td className="px-2 py-2 text-right text-gray-700 dark:text-gray-300"><ItemRowActions item={it} onUpdate={updateItem} onDelete={deleteItem} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>
            ) : (
                <div>
                    {loading ? (
                        <LoadingCards className="mt-2" />
                    ) : items.length === 0 ? (
                        <div className="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">No items found.</div>
                    ) : grouped ? (
                        <div className="space-y-4">
                            {groups.map((g) => (
                                <div key={g.key} className="rounded-xl border border-gray-200 dark:border-white/10">
                                    <button type="button" onClick={() => setOpenGroups((prev) => ({ ...prev, [g.key]: !prev[g.key] }))} className="w-full px-3 py-2 text-left">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {openGroups[g.key] ? (<ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />) : (<ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />)}
                                                <div className="h-6 w-6 rounded-md ring-1 ring-inset ring-gray-200 dark:ring-white/10" style={g.color ? { backgroundColor: g.color } : undefined} />
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={g.label}>{g.label}</div>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        {g.categoryName && (<span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300">{g.categoryName}</span>)}
                                                        {g.brand && <span>• {g.brand}</span>}
                                                        <span>• {g.items.length} variants</span>
                                                        <span>• Total stock: {g.totalStock}</span>
                                                        {!openGroups[g.key] && (
                                                            <span className="truncate">• sizes: {g.items.map((i) => i.size).filter(Boolean).slice(0, 4).join(", ")}{g.items.filter((i) => i.size).length > 4 ? "…" : ""}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-gray-600 dark:text-gray-300">
                                                <div>Price: {new Intl.NumberFormat(undefined, { style: "currency", currency: g.items[0]?.currency || "EUR" }).format(g.price)}</div>
                                                <div>Tax: {(g.taxRateBps / 100).toFixed(2)}%</div>
                                            </div>
                                        </div>
                                    </button>
                                    {openGroups[g.key] && (
                                        <div className="px-3 pb-3">
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                                {g.items.map((it) => (<ItemCard key={it.id} item={it} onUpdate={updateItem} onDelete={deleteItem} />))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {items.map((it) => (<ItemCard key={it.id} item={it} onUpdate={updateItem} onDelete={deleteItem} />))}
                        </div>
                    )}
                </div>
            )}

            <ConflictModal info={conflictInfo} onClose={() => setConflictInfo(null)} />
        </>
    )
}