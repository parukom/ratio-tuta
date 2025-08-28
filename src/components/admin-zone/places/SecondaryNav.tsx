import React from 'react'

type Props = {
    tab: 'logs' | 'places'
    setTab: (tab: 'logs' | 'places') => void
}
const SecondaryNav = ({ tab, setTab }: Props) => {
    return (
        <nav className="flex overflow-x-auto border-b border-gray-200 py-4 dark:border-white/10">
            <ul
                role="list"
                className="flex min-w-full flex-none gap-x-6 px-4 text-sm/6 font-semibold text-gray-500 sm:px-6 lg:px-8 dark:text-gray-400"
            >
                <li>
                    <button
                        type="button"
                        onClick={() => setTab('places')}
                        className={tab === 'places' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                    >
                        Places
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={() => setTab('logs')}
                        className={tab === 'logs' ? 'text-indigo-600 dark:text-indigo-400' : ''}
                    >
                        Logs
                    </button>
                </li>
            </ul>
        </nav>
    )
}
export default SecondaryNav;