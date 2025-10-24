"use client"

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Group, ItemRow } from './types'
import ItemCard from './ItemCard'
import GroupCard from './GroupCard'
import Spinner from '@/components/ui/Spinner'

type ItemsCardsViewProps = {
    items: ItemRow[]
    groups: Group[]
    grouped: boolean
    loading: boolean
    openGroups: Record<string, boolean>
    setOpenGroups: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void
    onItemUpdated: (updated: ItemRow) => void
    onItemDeleted: (id: string) => void
    onConflict?: (info: { id: string; places: { placeId: string; placeName: string; quantity: number }[]; kind?: 'item' }) => void
    onAskDeleteBox: (groupKey: string) => void
    onAskEditBox: (groupKey: string) => void
    onSelectItem?: (item: ItemRow) => void
    onSelectGroup?: (group: Group) => void
}

export default function ItemsCardsView({ items, groups, grouped, loading, openGroups, setOpenGroups, onItemUpdated, onItemDeleted, onConflict, onAskDeleteBox, onAskEditBox, onSelectItem, onSelectGroup }: ItemsCardsViewProps) {
    const t = useTranslations('Items')
    const [reveal, setReveal] = useState(false)

    useEffect(() => {
        if (!loading) {
            setReveal(false)
            // small timeout to ensure cards mount before fading content
            const tm = setTimeout(() => setReveal(true), 50)
            return () => clearTimeout(tm)
        }
    }, [loading, items.length, groups.length])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size={24} className="text-gray-400 dark:text-white/40" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="lg:rounded-lg border-y lg:border border-gray-200 p-8 text-center text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">{t('table.noItems')}</div>
        )
    }

    if (!grouped) {
        return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {items.map((it) => (
                    <ItemCard
                        key={it.id}
                        item={it}
                        reveal={reveal}
                        onItemUpdated={onItemUpdated}
                        onItemDeleted={onItemDeleted}
                        onConflict={onConflict}
                        onSelect={onSelectItem}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {groups.map((g) => {
                // If group has only 1 item, show it as ItemCard (for individual items)
                if (g.items.length === 1) {
                    return (
                        <ItemCard
                            key={g.items[0].id}
                            item={g.items[0]}
                            reveal={reveal}
                            onItemUpdated={onItemUpdated}
                            onItemDeleted={onItemDeleted}
                            onConflict={onConflict}
                            onSelect={onSelectItem}
                        />
                    )
                }
                // Otherwise show GroupCard (for boxes with multiple variants)
                return (
                    <GroupCard
                        key={g.key}
                        group={g}
                        reveal={reveal}
                        onSelect={() => onSelectGroup?.(g)}
                        onItemUpdated={onItemUpdated}
                        onItemDeleted={onItemDeleted}
                        onAskEditBox={onAskEditBox}
                        onAskDeleteBox={onAskDeleteBox}
                    />
                )
            })}
        </div>
    )
}
