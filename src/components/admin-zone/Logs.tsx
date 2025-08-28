import React, { useEffect, useState } from 'react'

const statuses: Record<'SUCCESS' | 'ERROR' | 'DENIED', string> = {
    SUCCESS: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
    ERROR: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
    DENIED: 'text-yellow-600 bg-yellow-600/10 dark:text-yellow-500 dark:bg-yellow-500/10',
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

type AuditRow = {
    id: number
    timestamp: string
    action: string
    status: 'SUCCESS' | 'ERROR' | 'DENIED'
    message?: string | null
    actorUser?: { id: number; name: string | null; email: string }
    targetTable?: string | null
    targetId?: number | null
}


const Logs = () => {

    const [activityItems, setActivityItems] = useState<AuditRow[]>([])
    const [activityLoading, setActivityLoading] = useState(true)


    // Fetch logs when on logs tab
    useEffect(() => {

        let cancelled = false
        setActivityLoading(true)
        fetch('/api/audit-logs?limit=25')
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data: AuditRow[]) => {
                if (!cancelled) setActivityItems(data)
            })
            .catch(() => {
                if (!cancelled) setActivityItems([])
            })
            .finally(() => {
                if (!cancelled) setActivityLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="border-t border-gray-200 pt-4 dark:border-white/10">
            <h2 className="px-4 text-base/7 font-semibold text-gray-900 sm:px-6 lg:px-8 dark:text-white">Latest activity</h2>
            <table className="mt-6 w-full text-left whitespace-nowrap">
                <colgroup>
                    <col className="w-full sm:w-4/12" />
                    <col className="lg:w-4/12" />
                    <col className="lg:w-2/12" />
                    <col className="lg:w-2/12" />
                    <col className="lg:w-1/12" />
                </colgroup>
                <thead className="border-b border-gray-200 text-sm/6 text-gray-900 dark:border-white/10 dark:text-white">
                    <tr>
                        <th scope="col" className="py-2 pr-8 pl-4 font-semibold sm:pl-6 lg:pl-8">
                            User
                        </th>
                        <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold sm:table-cell">
                            Action
                        </th>
                        <th scope="col" className="py-2 pr-4 pl-0 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">
                            Status
                        </th>
                        <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold md:table-cell lg:pr-20">
                            Details
                        </th>
                        <th
                            scope="col"
                            className="hidden py-2 pr-4 pl-0 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
                        >
                            When
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {activityLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                <td className="py-4 pr-8 pl-4 sm:pl-6 lg:pl-8" colSpan={5}>
                                    <div className="h-6 animate-pulse rounded bg-gray-100 dark:bg-white/5" />
                                </td>
                            </tr>
                        ))
                    ) : activityItems.length === 0 ? (
                        <tr>
                            <td className="py-4 pr-8 pl-4 text-sm text-gray-500 sm:pl-6 lg:pl-8" colSpan={5}>
                                No activity yet.
                            </td>
                        </tr>
                    ) : (
                        activityItems.map((item) => (
                            <tr key={item.id}>
                                <td className="py-4 pr-8 pl-4 sm:pl-6 lg:pl-8">
                                    <div className="flex items-center gap-x-4">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-1 ring-black/5 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10">
                                            {(item.actorUser?.name ?? item.actorUser?.email ?? 'NA')
                                                .split(' ')
                                                .map((s) => s.charAt(0))
                                                .slice(0, 2)
                                                .join('')}
                                        </div>
                                        <div className="truncate text-sm/6 font-medium text-gray-900 dark:text-white">
                                            {item.actorUser?.name ?? item.actorUser?.email ?? 'System'}
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden py-4 pr-4 pl-0 sm:table-cell sm:pr-8">
                                    <div className="font-mono text-sm/6 text-gray-500 dark:text-gray-400">{item.action}</div>
                                </td>
                                <td className="py-4 pr-4 pl-0 text-sm/6 sm:pr-8 lg:pr-20">
                                    <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                                        <div className={classNames(statuses[item.status], 'flex-none rounded-full p-1')}>
                                            <div className="size-1.5 rounded-full bg-current" />
                                        </div>
                                        <div className="hidden text-gray-900 sm:block dark:text-white">{item.status}</div>
                                    </div>
                                </td>
                                <td className="hidden py-4 pr-8 pl-0 text-sm/6 text-gray-500 md:table-cell lg:pr-20 dark:text-gray-400">
                                    {item.message || (item.targetTable && item.targetId ? `${item.targetTable}#${item.targetId}` : '—')}
                                </td>
                                <td className="hidden py-4 pr-4 pl-0 text-right text-sm/6 text-gray-500 sm:table-cell sm:pr-6 lg:pr-8 dark:text-gray-400">
                                    <time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString()}</time>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
export default Logs;