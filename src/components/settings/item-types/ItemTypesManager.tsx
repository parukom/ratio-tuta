"use client"

import React, { useCallback, useEffect, useState } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import Input from '@/components/ui/Input'
import { toast } from 'react-hot-toast'

// Minimal in-place editor for Item Types using /api/item-types

export type FieldDef = {
    key: string
    label: string
    type: 'text' | 'number' | 'select' | 'boolean'
    required?: boolean
    unit?: string | null
    options?: string[]
}

type ItemType = {
    id: string
    teamId: string
    name: string
    slug: string
    description?: string | null
    isActive: boolean
    placeTypeId?: string | null
    fields: FieldDef[]
    createdAt: string
}

export default function ItemTypesManager() {
    const [loading, setLoading] = useState(false)
    const [types, setTypes] = useState<ItemType[]>([])
    const [message, setMessage] = useState('')

    // Create form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [placeTypeId, setPlaceTypeId] = useState<string | ''>('')
    const [fields, setFields] = useState<FieldDef[]>([])

    const loadTypes = useCallback(async () => {
        try {
            const qs = new URLSearchParams()
            qs.set('onlyActive', 'true')
            const r = await fetch(`/api/item-types?${qs.toString()}`)
            const data = await r.json()
            if (!r.ok) { setTypes([]); return }
            setTypes(Array.isArray(data) ? data : [])
        } catch { setTypes([]) }
    }, [])

    useEffect(() => { loadTypes() }, [loadTypes])

    function addField() {
        setFields(prev => [...prev, { key: '', label: '', type: 'text', required: false, unit: null, options: [] }])
    }
    function updateField(idx: number, patch: Partial<FieldDef>) {
        setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))
    }
    function removeField(idx: number) {
        setFields(prev => prev.filter((_, i) => i !== idx))
    }

    async function submitCreate(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                placeTypeId: placeTypeId || null,
                fields: fields.map(f => ({
                    key: f.key?.trim() || undefined,
                    label: f.label?.trim() || '',
                    type: f.type,
                    required: !!f.required,
                    unit: (f.unit && f.unit.trim()) ? f.unit.trim() : null,
                    ...(f.type === 'select' ? { options: (f.options || []).map(o => String(o).trim()).filter(Boolean) } : {}),
                })),
            }
            const r = await fetch('/api/item-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const data = await r.json()
            if (!r.ok) { const err = data.error || 'Failed to create'; setMessage(err); toast.error(err); return }
            toast.success('Item type created')
            setName(''); setDescription(''); setPlaceTypeId(''); setFields([])
            setTypes(prev => {
                const next = [...prev, data]
                next.sort((a, b) => a.name.localeCompare(b.name))
                return next
            })
        } catch {
            setMessage('Network error')
            toast.error('Network error')
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-6">
            <section>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Item types</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Define the custom fields your items can have. These types are team-scoped.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {types.map((t) => (
                        <div key={t.id} className="rounded-md border border-gray-200 p-3 dark:border-white/10">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{t.name}</div>
                            {t.description && <div className="text-sm text-gray-600 dark:text-gray-400">{t.description}</div>}
                            {t.fields.length > 0 && (
                                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
                                    {t.fields.map((f) => (
                                        <li key={f.key}>
                                            <span className="font-medium">{f.label}</span> – {f.type}{f.unit ? ` (${f.unit})` : ''}{f.required ? ' *' : ''}
                                            {f.type === 'select' && f.options && f.options.length > 0 && (
                                                <span className="text-gray-500 dark:text-gray-400"> [{f.options.join(', ')}]</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                    {types.length === 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">No item types yet.</div>
                    )}
                </div>
            </section>

            <section className="pt-2 border-t border-gray-200 dark:border-white/10">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Create a new item type</h3>
                <form onSubmit={submitCreate} className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    {/* Optional place type selector. Placeholder until place types API exists client-side. */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place type (optional)</label>
                        <Input type="text" placeholder="Place type id" value={placeTypeId} onChange={(e) => setPlaceTypeId(e.target.value)} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fields</label>
                            <button type="button" onClick={addField} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">+ Add field</button>
                        </div>
                        <div className="mt-2 space-y-3">
                            {fields.map((f, idx) => (
                                <div key={idx} className="rounded-md border border-gray-200 p-3 dark:border-white/10">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                        <Input type="text" placeholder="Label" value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                                        <Input type="text" placeholder="Key (optional)" value={f.key} onChange={(e) => updateField(idx, { key: e.target.value })} />
                                        <div>
                                            <Dropdown
                                                align="left"
                                                buttonLabel={f.type}
                                                items={[
                                                    { key: 'text', label: 'Text' },
                                                    { key: 'number', label: 'Number' },
                                                    { key: 'boolean', label: 'Boolean' },
                                                    { key: 'select', label: 'Select' },
                                                ]}
                                                onSelect={(key) => updateField(idx, { type: key as FieldDef['type'] })}
                                            />
                                        </div>
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(idx, { required: e.target.checked })} /> Required
                                        </label>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Input type="text" placeholder="Unit (optional, e.g. kg, cm)" value={f.unit ?? ''} onChange={(e) => updateField(idx, { unit: e.target.value })} />
                                        {f.type === 'select' && (
                                            <Input type="text" placeholder="Options (comma-separated)" value={(f.options || []).join(', ')} onChange={(e) => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                        )}
                                    </div>
                                    <div className="mt-2 text-right">
                                        <button type="button" onClick={() => removeField(idx)} className="text-xs text-red-600 hover:underline dark:text-red-400">Remove</button>
                                    </div>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">No fields yet. Click &quot;+ Add field&quot; to start.</div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Keys must be unique and start with a letter. Select requires non-empty options.</p>
                        <button type="submit" disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400">Create</button>
                    </div>
                    {message && <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>}
                </form>
            </section>
        </div>
    )
}
