'use client'
import { useEffect, useState } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, NoSymbolIcon } from '@heroicons/react/24/outline'

export type ActivityItem = {
    id: number
    timestamp: string
    action: string
    status: 'SUCCESS' | 'ERROR' | 'DENIED'
    message?: string | null
    actorUser?: { id: number; name: string | null; email: string }
    team?: { id: number; name: string }
    targetTable?: string | null
    targetId?: number | null
}

function statusIcon(status: ActivityItem['status']) {
    const cls = 'size-5'
    switch (status) {
        case 'SUCCESS':
            return <CheckCircleIcon className={cls + ' text-green-600'} />
        case 'DENIED':
            return <NoSymbolIcon className={cls + ' text-yellow-600'} />
        case 'ERROR':
        default:
            return <ExclamationTriangleIcon className={cls + ' text-red-600'} />
    }
}

export default function ActivityList({ teamId, limit = 50 }: { teamId?: number; limit?: number }) {
    const [items, setItems] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        const qs = new URLSearchParams()
        if (teamId) qs.set('teamId', String(teamId))
        if (limit) qs.set('limit', String(limit))
        fetch(`/api/audit-logs?${qs.toString()}`)
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data) => {
                if (!cancelled) setItems(data)
            })
            .catch(() => {
                if (!cancelled) setItems([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [teamId, limit])

    if (loading) {
        return (
            <ul role="list" className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="h-16 animate-pulse rounded-md bg-gray-100 dark:bg-white/5" />
                ))}
            </ul>
        )
    }

    return (
        <ul role="list" className="space-y-4">
            {items.map((i) => (
                <li key={i.id} className="flex items-start gap-3 rounded-md border border-gray-200 p-3 dark:border-white/10">
                    <div className="mt-0.5">{statusIcon(i.status)}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">{i.actorUser?.name ?? i.actorUser?.email ?? 'System'}</span>
                            <span className="text-gray-500">{new Date(i.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{i.action}</span>
                            {i.message ? <span className="ml-2 text-gray-500">— {i.message}</span> : null}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            {i.team?.name ? <span>Team: {i.team.name}</span> : null}
                            {i.targetTable && i.targetId ? <span className="ml-2">Target: {i.targetTable}#{i.targetId}</span> : null}
                        </div>
                    </div>
                </li>
            ))}
            {items.length === 0 ? (
                <li className="text-sm text-gray-500">No activity yet.</li>
            ) : null}
        </ul>
    )
}
