import Input from '@/components/ui/Input'
import ImageUploader from '@/components/ui/ImageUploader'
import { useTranslations } from 'next-intl'
import React from 'react'
import toast from 'react-hot-toast'
import type { ItemRow } from './types'

type EditRow = { id: string; size: string; quantity: string; itemId?: string }

type Props = {
    editBoxKey: string | null
    setEditBoxKey: (key: string | null) => void
    editLoading: boolean
    setEditLoading: (v: boolean) => void
    editMsg: string
    setEditMsg: (msg: string) => void
    editImage: File | null
    setEditImage: (file: File | null) => void
    editPrice: string
    setEditPrice: (v: string) => void
    editBoxCost: string
    setEditBoxCost: (v: string) => void
    editTaxBps: string
    setEditTaxBps: (v: string) => void
    editRows: EditRow[]
    addEditRow: () => void
    removeEditRow: (id: string) => void
    updateEditRow: (id: string, patch: Partial<EditRow>) => void
    items: ItemRow[]
    updateItem: (id: string, patch: Partial<Pick<ItemRow, 'name' | 'sku' | 'price' | 'pricePaid' | 'taxRateBps' | 'isActive' | 'measurementType' | 'stockQuantity' | 'description' | 'color' | 'size' | 'brand' | 'tags' | 'categoryId'>>) => Promise<void>
    fetchItems: () => void | Promise<void>
}

export const EditBoxModal: React.FC<Props> = ({
    editBoxKey,
    setEditBoxKey,
    editLoading,
    setEditLoading,
    editMsg,
    setEditMsg,
    editImage,
    setEditImage,
    editPrice,
    setEditPrice,
    editBoxCost,
    setEditBoxCost,
    editTaxBps,
    setEditTaxBps,
    editRows,
    addEditRow,
    removeEditRow,
    updateEditRow,
    items,
    updateItem,
    fetchItems,
}) => {
    const t = useTranslations('Items')
    const tc = useTranslations('Common')

    return (
        <>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('modals.editBox.title')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('modals.editBox.subtitle')}</p>
            <div className="mt-4 space-y-3">
                <ImageUploader
                    id="edit-box-image"
                    label={t('modals.editBox.replacePicture')}
                    value={editImage}
                    onChange={setEditImage}
                    hint={t('modals.editBox.pictureHint')}

                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input type="number" placeholder={t('modals.editBox.price')} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                    <Input type="number" placeholder={t('modals.editBox.boxCost')} value={editBoxCost} onChange={(e) => setEditBoxCost(e.target.value)} />
                    <Input type="number" placeholder={t('modals.editBox.taxBps')} value={editTaxBps} onChange={(e) => setEditTaxBps(e.target.value)} />
                </div>
                <div>
                    <div className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-200">{t('modals.editBox.sizesTitle')}</div>
                    <div className="space-y-2">
                        {editRows.map((row) => (
                            <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                                <div className="col-span-6"><Input type="text" placeholder={t('modals.editBox.variantSize')} value={row.size} onChange={(e) => updateEditRow(row.id, { size: e.target.value })} /></div>
                                <div className="col-span-4"><Input type="number" placeholder={t('modals.editBox.quantity')} value={row.quantity} onChange={(e) => updateEditRow(row.id, { quantity: e.target.value })} /></div>
                                <div className="col-span-2 flex justify-end"><button type="button" onClick={() => removeEditRow(row.id)} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">{t('modals.editBox.remove')}</button></div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2"><button type="button" onClick={addEditRow} className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">{t('modals.editBox.addSize')}</button></div>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditBoxKey(null)} disabled={editLoading} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">{t('modals.editBox.cancel')}</button>
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
                                const data: unknown = await res.json().catch(() => ({}))
                                const errMsg = (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string')
                                    ? (data as { error: string }).error
                                    : 'Failed to update box'
                                if (!res.ok) throw new Error(errMsg)
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
                            toast.success(t('toasts.updated'))
                            setEditBoxKey(null)
                            setEditImage(null)
                            fetchItems()
                        } catch (e) {
                            setEditMsg((e as Error)?.message || tc('errors.failedToSave'))
                            toast.error(tc('errors.failedToSave'))
                        } finally { setEditLoading(false) }
                    }}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >{editLoading ? t('modals.editBox.saving') : t('modals.editBox.save')}</button>
            </div>
            {editMsg && <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">{editMsg}</p>}
        </>
    )
}
