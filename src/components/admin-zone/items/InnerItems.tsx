"use client"

import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { ConflictModal } from "./ConflictModal"
// header UI moved to ItemsHeader
import Modal from "@/components/modals/Modal"
import ItemsTableView from "./ItemsTableView"
import ItemsCardsView from "./ItemsCardsView"
import type { ItemRow, Group } from "./types"
import ItemInfoDrawer from "./ItemInfoDrawer"
import { useTranslations } from 'next-intl'
import { ConfirmDeleteBoxModal } from "./ConfirmDeleteBoxModal"
import { EditBoxModal } from "./EditBoxModal"
import ItemsHeader from "./ItemsHeader"
import ItemsPagination from "./ItemsPagination"

// ItemRow and Group types moved to ./types for reuse across components

export default function InnerItems() {
    const t = useTranslations('Items')
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
    // Item info drawer
    const [infoOpen, setInfoOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ItemRow | null>(null)

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
    const [total, setTotal] = useState<number>(0)
    const [page, setPage] = useState<number>(1)
    const perPage = 25
    const boxesPerPage = 10
    const [loading, setLoading] = useState(false)
    const [conflictInfo, setConflictInfo] = useState<null | { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' | 'box' }>(null)
    type Category = { id: string; name: string }
    const [categories, setCategories] = useState<Category[]>([])
    // Deleting a whole box (group)
    const [confirmBoxKey, setConfirmBoxKey] = useState<string | null>(null)
    // Edit box modal
    const [editBoxKey, setEditBoxKey] = useState<string | null>(null)
    const [editLoading, setEditLoading] = useState(false)
    const [editMsg, setEditMsg] = useState("")
    const [editImage, setEditImage] = useState<File | null>(null)
    const [editPrice, setEditPrice] = useState<string>("")
    const [editBoxCost, setEditBoxCost] = useState<string>("")
    const [editTaxBps, setEditTaxBps] = useState<string>("")
    // If edit modal opens, ensure drawer is closed and selection cleared
    useEffect(() => {
        if (editBoxKey) { setInfoOpen(false); setSelectedItem(null) }
    }, [editBoxKey])
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
    // When filters or view mode change, reset to page 1
    useEffect(() => { setPage(1) }, [q, onlyActive, categoryId, measurementType, inStock, minPrice, maxPrice, sort, view, grouped])
    // Fetch whenever filters, page, or view mode change
    useEffect(() => {
        setLoading(true)
        const t = setTimeout(() => { fetchItems() }, 250)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q, onlyActive, categoryId, measurementType, inStock, minPrice, maxPrice, sort, page, view, grouped])

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
            const groupedMode = (view === 'cards' && grouped)
            if (!groupedMode) {
                params.set("page", String(page))
                params.set("perPage", String(perPage))
            }
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
            if (!res.ok) throw new Error(t('toasts.loadFailed'))
            const data: unknown = await res.json()
            if (Array.isArray(data)) {
                setItems(data as ItemRow[])
                // total is used only for item pagination; in grouped mode, pages are computed from groups later
                setTotal((data as ItemRow[]).length)
            } else if (data && typeof data === 'object') {
                const obj = data as { items?: ItemRow[]; total?: number; page?: number; perPage?: number }
                setItems(Array.isArray(obj.items) ? obj.items : [])
                setTotal(typeof obj.total === 'number' ? obj.total : 0)
            } else {
                setItems([])
                setTotal(0)
            }
        } catch (e) {
            console.error(e)
            toast.error(t('toasts.loadFailed'))
        } finally { setLoading(false) }
    }

    // Delete a whole box (group)
    // handled inside ConfirmDeleteBoxModal now

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
        toast.success(t('toasts.created'))
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
        toast.success(t('toasts.updated'))
    }
    // deleteItem moved into child components (ItemRowActions) via callbacks

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

    const totalPagesItems = Math.max(1, Math.ceil(total / perPage))
    const totalPagesBoxes = Math.max(1, Math.ceil(groups.length / boxesPerPage))
    const pagedGroups = useMemo(() => {
        if (!(view === 'cards' && grouped)) return groups
        const start = (page - 1) * boxesPerPage
        return groups.slice(start, start + boxesPerPage)
    }, [groups, view, grouped, page, boxesPerPage])

    return (
        <>
            <ItemsHeader
                q={q}
                setQ={setQ}
                inStock={inStock}
                setInStock={setInStock}
                onlyActive={onlyActive}
                setOnlyActive={setOnlyActive}
                view={view}
                setView={setView}
                grouped={grouped}
                setGrouped={setGrouped}
                onExpandAll={expandAllGroups}
                onCollapseAll={collapseAllGroups}
                categories={categories}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                sort={sort}
                setSort={setSort}
                onReset={() => { setQ(""); setOnlyActive(false); setCategoryId(""); setMeasurementType(""); setInStock(false); setMinPrice(""); setMaxPrice(""); setSort("createdAt_desc") }}
                onItemCreated={onCreated}
                onBoxDone={fetchItems}
            />

            <main className="p-4">

                {/* Views */}
                {view === "table" ? (
                    <ItemsTableView
                        items={items}
                        loading={loading}
                        onItemUpdated={(updated) => {
                            setItems((prev) => prev.map((it) => it.id === updated.id ? { ...it, ...updated } : it))
                        }}
                        onItemDeleted={(id) => {
                            setItems((prev) => prev.filter((it) => it.id !== id))
                        }}
                        onConflict={(info) => setConflictInfo(info)}
                        onSelectItem={(it) => { setSelectedItem(it); setInfoOpen(true) }}
                    />
                ) : (
                    <ItemsCardsView
                        items={items}
                        groups={grouped ? pagedGroups : groups}
                        grouped={grouped}
                        loading={loading}
                        openGroups={openGroups}
                        setOpenGroups={(updater) => setOpenGroups((prev) => updater(prev))}
                        onItemUpdated={(updated) => {
                            setItems((prev) => prev.map((it) => it.id === updated.id ? { ...it, ...updated } : it))
                        }}
                        onItemDeleted={(id) => {
                            setItems((prev) => prev.filter((it) => it.id !== id))
                        }}
                        onConflict={(info) => setConflictInfo(info)}
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
                        onSelectItem={(it) => { setSelectedItem(it); setInfoOpen(true) }}
                    />
                )}
            </main>

            {/* Pagination */}
            <ItemsPagination
                page={page}
                setPage={(n) => setPage(n)}
                totalPages={(view === 'cards' && grouped) ? totalPagesBoxes : totalPagesItems}
                disabled={loading}
            />

            <ConflictModal info={conflictInfo} onClose={() => setConflictInfo(null)} />

            {/* Confirm delete box modal */}
            <Modal open={!!confirmBoxKey} onClose={() => setConfirmBoxKey(null)} size="sm">
                <ConfirmDeleteBoxModal
                    confirmBoxKey={confirmBoxKey}
                    onClose={() => setConfirmBoxKey(null)}
                    onDeleted={(groupKey) => {
                        // Optimistically remove items from this group
                        setItems((prev) => prev.filter((it) => {
                            const base = (it.name || "").split(" - ")[0] || it.name
                            const key = `${it.teamId}|${base}|${it.color || ""}`
                            return key !== groupKey
                        }))
                    }}
                    onConflict={(info) => setConflictInfo(info)}
                />
            </Modal>

            {/* Edit box modal */}
            <Modal open={!!editBoxKey} onClose={() => (!editLoading && setEditBoxKey(null))} size="lg">
                <EditBoxModal
                    editBoxKey={editBoxKey}
                    setEditBoxKey={setEditBoxKey}
                    editLoading={editLoading}
                    setEditLoading={setEditLoading}
                    editMsg={editMsg}
                    setEditMsg={setEditMsg}
                    editImage={editImage}
                    setEditImage={setEditImage}
                    editPrice={editPrice}
                    setEditPrice={setEditPrice}
                    editBoxCost={editBoxCost}
                    setEditBoxCost={setEditBoxCost}
                    editTaxBps={editTaxBps}
                    setEditTaxBps={setEditTaxBps}
                    editRows={editRows}
                    addEditRow={addEditRow}
                    removeEditRow={removeEditRow}
                    updateEditRow={updateEditRow}
                    items={items}
                    updateItem={updateItem}
                    fetchItems={fetchItems}
                />
            </Modal>

            <ItemInfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} item={selectedItem} />
        </>
    )
}