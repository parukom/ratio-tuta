'use client'
import Image from 'next/image'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import AdminLayout from '@/components/layout/AdminLayout'


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
const statuses: Record<string, string> = {
    Completed: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-400/10',
    Error: 'text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-400/10',
}
const activityItems = [
    {
        user: {
            name: 'Michael Foster',
            imageUrl:
                'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '2d89f0c8',
        branch: 'main',
        status: 'Completed',
        duration: '25s',
        date: '45 minutes ago',
        dateTime: '2023-01-23T11:00',
    },
    {
        user: {
            name: 'Lindsay Walton',
            imageUrl:
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '249df660',
        branch: 'main',
        status: 'Completed',
        duration: '1m 32s',
        date: '3 hours ago',
        dateTime: '2023-01-23T09:00',
    },
    {
        user: {
            name: 'Courtney Henry',
            imageUrl:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '11464223',
        branch: 'main',
        status: 'Error',
        duration: '1m 4s',
        date: '12 hours ago',
        dateTime: '2023-01-23T00:00',
    },
    {
        user: {
            name: 'Courtney Henry',
            imageUrl:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: 'dad28e95',
        branch: 'main',
        status: 'Completed',
        duration: '2m 15s',
        date: '2 days ago',
        dateTime: '2023-01-21T13:00',
    },
    {
        user: {
            name: 'Michael Foster',
            imageUrl:
                'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '624bc94c',
        branch: 'main',
        status: 'Completed',
        duration: '1m 12s',
        date: '5 days ago',
        dateTime: '2023-01-18T12:34',
    },
    {
        user: {
            name: 'Courtney Henry',
            imageUrl:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: 'e111f80e',
        branch: 'main',
        status: 'Completed',
        duration: '1m 56s',
        date: '1 week ago',
        dateTime: '2023-01-16T15:54',
    },
    {
        user: {
            name: 'Michael Foster',
            imageUrl:
                'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '5e136005',
        branch: 'main',
        status: 'Completed',
        duration: '3m 45s',
        date: '1 week ago',
        dateTime: '2023-01-16T11:31',
    },
    {
        user: {
            name: 'Whitney Francis',
            imageUrl:
                'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        commit: '5c1fd07f',
        branch: 'main',
        status: 'Completed',
        duration: '37s',
        date: '2 weeks ago',
        dateTime: '2023-01-09T08:45',
    },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const Home = () => {
    return (
        <>
            <AdminLayout>
                <div>
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
                                <h2 className="px-4 text-base/7 font-semibold text-gray-900 sm:px-6 lg:px-8 dark:text-white">
                                    Latest activity
                                </h2>
                                <table className="mt-6 w-full text-left whitespace-nowrap">
                                    <colgroup>
                                        <col className="w-full sm:w-4/12" />
                                        <col className="lg:w-4/12" />
                                        <col className="lg:w-2/12" />
                                        <col className="lg:w-1/12" />
                                        <col className="lg:w-1/12" />
                                    </colgroup>
                                    <thead className="border-b border-gray-200 text-sm/6 text-gray-900 dark:border-white/10 dark:text-white">
                                        <tr>
                                            <th scope="col" className="py-2 pr-8 pl-4 font-semibold sm:pl-6 lg:pl-8">
                                                User
                                            </th>
                                            <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold sm:table-cell">
                                                Commit
                                            </th>
                                            <th scope="col" className="py-2 pr-4 pl-0 text-right font-semibold sm:pr-8 sm:text-left lg:pr-20">
                                                Status
                                            </th>
                                            <th scope="col" className="hidden py-2 pr-8 pl-0 font-semibold md:table-cell lg:pr-20">
                                                Duration
                                            </th>
                                            <th
                                                scope="col"
                                                className="hidden py-2 pr-4 pl-0 text-right font-semibold sm:table-cell sm:pr-6 lg:pr-8"
                                            >
                                                Deployed at
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {activityItems.map((item) => (
                                            <tr key={item.commit}>
                                                <td className="py-4 pr-8 pl-4 sm:pl-6 lg:pl-8">
                                                    <div className="flex items-center gap-x-4">
                                                        <Image
                                                            alt=""
                                                            src={item.user.imageUrl}
                                                            className="size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                                                            width={32}
                                                            height={32}
                                                        />
                                                        <div className="truncate text-sm/6 font-medium text-gray-900 dark:text-white">
                                                            {item.user.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-4 pr-4 pl-0 sm:table-cell sm:pr-8">
                                                    <div className="flex gap-x-3">
                                                        <div className="font-mono text-sm/6 text-gray-500 dark:text-gray-400">{item.commit}</div>
                                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-300 ring-inset dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
                                                            {item.branch}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-4 pl-0 text-sm/6 sm:pr-8 lg:pr-20">
                                                    <div className="flex items-center justify-end gap-x-2 sm:justify-start">
                                                        <time dateTime={item.dateTime} className="text-gray-500 sm:hidden dark:text-gray-400">
                                                            {item.date}
                                                        </time>
                                                        <div className={classNames(statuses[item.status], 'flex-none rounded-full p-1')}>
                                                            <div className="size-1.5 rounded-full bg-current" />
                                                        </div>
                                                        <div className="hidden text-gray-900 sm:block dark:text-white">{item.status}</div>
                                                    </div>
                                                </td>
                                                <td className="hidden py-4 pr-8 pl-0 text-sm/6 text-gray-500 md:table-cell lg:pr-20 dark:text-gray-400">
                                                    {item.duration}
                                                </td>
                                                <td className="hidden py-4 pr-4 pl-0 text-right text-sm/6 text-gray-500 sm:table-cell sm:pr-6 lg:pr-8 dark:text-gray-400">
                                                    <time dateTime={item.dateTime}>{item.date}</time>
                                                </td>
                                            </tr>
                                        ))}
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