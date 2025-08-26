'use client'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import AdminLayout from '@/components/layout/AdminLayout'
import { useEffect, useState } from 'react'
import CreatePlaceButton from '@/components/admin-zone/places/CreatePlaceButton'


const secondaryNavigation = [
    { name: 'Overview', href: '#', current: true },
    { name: 'Activity', href: '#', current: false },
    { name: 'Settings', href: '#', current: false },
    { name: 'Collaborators', href: '#', current: false },
    { name: 'Notifications', href: '#', current: false },
]
const stats = [
    { name: 'Number of deploys', value: '405' },
    { name: 'Average deploy time', value: '3.65', unit: 'mins' },
    { name: 'Number of servers', value: '3' },
    { name: 'Success rate', value: '98.5%' },
]
const statuses: Record<'SUCCESS' | 'ERROR' | 'DENIED', string> = {
    SUCCESS: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
    ERROR: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
    DENIED: 'text-yellow-600 bg-yellow-600/10 dark:text-yellow-500 dark:bg-yellow-500/10',
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

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const Home = () => {
    const [activityItems, setActivityItems] = useState<AuditRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        fetch('/api/audit-logs?limit=25')
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then((data: AuditRow[]) => {
                if (!cancelled) setActivityItems(data)
            })
            .catch(() => {
                if (!cancelled) setActivityItems([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])
    return (
        <>
            <AdminLayout>
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Team</h1>
                        <CreatePlaceButton />
                    </div>
                    <div className="">
                        {/* Sticky search header */}
                        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
                            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                                <form action="#" method="GET" className="grid flex-1 grid-cols-1">
                                    <input
                                        name="search"
                                        placeholder="Search"
                                        aria-label="Search"
                                        className="col-start-1 row-start-1 block size-full bg-transparent pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6 dark:text-white dark:placeholder:text-gray-500"
                                    />
                                    <MagnifyingGlassIcon
                                        aria-hidden="true"
                                        className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400 dark:text-gray-500"
                                    />
                                </form>
                            </div>
                        </div>

                        <main>
                            <header>
                                {/* Secondary navigation */}
                                <nav className="flex overflow-x-auto border-b border-gray-200 py-4 dark:border-white/10">
                                    <ul
                                        role="list"
                                        className="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8 dark:text-gray-400"
                                    >
                                        {secondaryNavigation.map((item) => (
                                            <li key={item.name}>
                                                <a href={item.href} className={item.current ? 'text-indigo-600 dark:text-indigo-400' : ''}>
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>

                                {/* Heading */}
                                <div className="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 dark:bg-gray-700/10">
                                    <div>
                                        <div className="flex items-center gap-x-3">
                                            <div className="flex-none rounded-full bg-green-500/10 p-1 text-green-500 dark:bg-green-400/10 dark:text-green-400">
                                                <div className="size-2 rounded-full bg-current" />
                                            </div>
                                            <h1 className="flex gap-x-3 text-base/7">
                                                <span className="font-semibold text-gray-900 dark:text-white">Planetaria</span>
                                                <span className="text-gray-400 dark:text-gray-600">/</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">mobile-api</span>
                                            </h1>
                                        </div>
                                        <p className="mt-2 text-xs/6 text-gray-500 dark:text-gray-400">Deploys from GitHub via main branch</p>
                                    </div>
                                    <div className="order-first flex-none rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-500 ring-1 ring-indigo-200 ring-inset sm:order-0 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30">
                                        Production
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-1 bg-gray-50 sm:grid-cols-2 lg:grid-cols-4 dark:bg-gray-700/10">
                                    {stats.map((stat, statIdx) => (
                                        <div
                                            key={stat.name}
                                            className={classNames(
                                                statIdx % 2 === 1 ? 'sm:border-l' : statIdx === 2 ? 'lg:border-l' : '',
                                                'border-t border-gray-200/50 px-4 py-6 sm:px-6 lg:px-8 dark:border-white/5',
                                            )}
                                        >
                                            <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                                            <p className="mt-2 flex items-baseline gap-x-2">
                                                <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                                    {stat.value}
                                                </span>
                                                {stat.unit ? <span className="text-sm text-gray-500 dark:text-gray-400">{stat.unit}</span> : null}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </header>

                            {/* Activity list */}
                            <div className="border-t border-gray-200 pt-11 dark:border-white/10">
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
                                        {loading ? (
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
                        </main>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}
export default Home;