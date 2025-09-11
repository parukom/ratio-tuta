'use client'

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import {
    Bars3Icon,
    // CalendarIcon,
    ChartPieIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    HomeIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '../LogoutButton'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

type NavKey = 'home' | 'team' | 'items' | 'documents' | 'reports' | 'settings'
const navigation: Array<{ key: NavKey; href: string; icon: React.ComponentType<React.ComponentProps<'svg'>> }> = [
    { key: 'home', href: '/dashboard/home', icon: HomeIcon },
    { key: 'team', href: '/dashboard/team', icon: UsersIcon },
    { key: 'items', href: '/dashboard/items', icon: FolderIcon },
    // { key: 'calendar', href: '/dashboard/calendar', icon: CalendarIcon },
    { key: 'documents', href: '/dashboard/documents', icon: DocumentDuplicateIcon },
    { key: 'reports', href: '/dashboard/reports', icon: ChartPieIcon },
    { key: 'settings', href: '/dashboard/settings', icon: Settings },
]
type UserPlace = {
    id: string
    name: string
}

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

type AdminLayoutProps = {
    title?: string
    children?: ReactNode
    secondary?: ReactNode
}

// Helper to derive initials
function getInitials(name?: string | null, email?: string | null) {
    const base = (name && name.trim()) || (email ? email.split('@')[0] : '') || '?'
    const parts = base.split(/\s+/).filter(Boolean)
    const initials =
        parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]) : base.slice(0, 2)
    return initials.toUpperCase()
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
    const t = useTranslations('Admin')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [places, setPlaces] = useState<UserPlace[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(false)
    const pathname = usePathname()

    // NEW: current user info for avatar/initials
    type CurrentUser = { name?: string | null; email?: string | null; avatarUrl?: string | null }
    const [me, setMe] = useState<CurrentUser | null>(null)
    const [meLoading, setMeLoading] = useState(true)
    const [avatarError, setAvatarError] = useState(false)

    const loadPlaces = useCallback(async () => {
        try {
            setLoadingPlaces(true)
            const res = await fetch('/api/places', { method: 'GET' })
            if (!res.ok) return
            const data = (await res.json()) as Array<{ id: string; name: string }>
            setPlaces(Array.isArray(data) ? data.map(p => ({ id: p.id, name: p.name })) : [])
        } catch {
            // ignore network errors for sidebar list
        } finally {
            setLoadingPlaces(false)
        }
    }, [])

    // initial load
    useEffect(() => { void loadPlaces() }, [loadPlaces])

    // listen for create/delete updates to refresh without full reload
    useEffect(() => {
        const handler = () => { void loadPlaces() }
        window.addEventListener('places:changed', handler as EventListener)
        return () => {
            window.removeEventListener('places:changed', handler as EventListener)
        }
    }, [loadPlaces])

    const placeLink = useMemo(() => (placeId: string) => `/dashboard/home/place/${placeId}`, [])

    useEffect(() => {
        let ignore = false
            ; (async () => {
                try {
                    const res = await fetch('/api/users/me', { method: 'GET' })
                    if (!res.ok) return
                    const data = (await res.json()) as CurrentUser
                    if (!ignore) setMe(data)
                } catch {
                    // ignore
                }
                finally {
                    if (!ignore) setMeLoading(false)
                }
            })()
        return () => { ignore = true }
    }, [])

    // Dashboard readiness: initial user + places fetched
    const isReady = !meLoading && !loadingPlaces

    const headerRef = useRef<HTMLDivElement | null>(null)

    // Measure sticky header height so we can offset scroll anchoring & focus auto-scroll
    useEffect(() => {
        function setVar() {
            if (headerRef.current) {
                document.documentElement.style.setProperty('--app-header-height', headerRef.current.offsetHeight + 'px')
            }
        }
        setVar()
        window.addEventListener('resize', setVar)
        return () => window.removeEventListener('resize', setVar)
    }, [])

    return (
        <>
            <LoadingOverlay
                isReady={isReady}
                minDuration={2400}
                label="Loading..."
                steps={["Fetching profile", "Loading events", "Retrieving recent items"]}
            />
            <div>
                <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
                    />

                    <div className="fixed inset-0 flex">
                        <DialogPanel
                            transition
                            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
                        >
                            <TransitionChild>
                                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                                    <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                                        <span className="sr-only">{t('closeSidebar')}</span>
                                        <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                                    </button>
                                </div>
                            </TransitionChild>

                            {/* Sidebar component, swap this element with another sidebar if you like */}
                            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:border-r dark:before:border-white/10 dark:before:bg-black/10">
                                <div className="relative flex h-16 shrink-0 items-center">
                                    <Image
                                        alt={t('brandAlt')}
                                        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                        className="h-8 w-8 dark:hidden"
                                        width={32}
                                        height={32}
                                    />
                                    <Image
                                        alt={t('brandAlt')}
                                        src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=400"
                                        className="h-8 w-8 not-dark:hidden"
                                        width={32}
                                        height={32}
                                    />
                                </div>
                                <nav className="relative flex flex-1 flex-col">
                                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                        <li>
                                            <ul role="list" className="-mx-2 space-y-1">

                                                {navigation.map((item) => {
                                                    const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`)
                                                    return (
                                                        <li key={item.key}
                                                            onClick={() => {
                                                                setSidebarOpen(false)
                                                            }}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                className={classNames(
                                                                    isCurrent
                                                                        ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                                                    'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                                )}
                                                            >
                                                                <item.icon
                                                                    aria-hidden="true"
                                                                    className={classNames(
                                                                        isCurrent
                                                                            ? 'text-indigo-600 dark:text-white'
                                                                            : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white',
                                                                        'size-6 shrink-0',
                                                                    )}
                                                                />
                                                                {t(`nav.${item.key}`)}
                                                            </Link>
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        </li>
                                        <li>
                                            <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">{t('yourPlaces')}</div>
                                            <ul role="list" className="-mx-2 mt-2 space-y-1">
                                                {loadingPlaces && places.length === 0 ? (
                                                    <li className="px-2 text-sm text-gray-400">{t('loading')}</li>
                                                ) : places.length === 0 ? (
                                                    <li className="px-2 text-sm text-gray-400">{t('noPlaces')}</li>
                                                ) : (
                                                    places.map((place) => {
                                                        const isCurrent = pathname === placeLink(place.id) || pathname.startsWith(`${placeLink(place.id)}/`)
                                                        return (
                                                            <li key={place.id}>
                                                                <Link
                                                                    onClick={() => setSidebarOpen(false)}
                                                                    href={placeLink(place.id)}
                                                                    className={classNames(
                                                                        isCurrent
                                                                            ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                                                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                                    )}
                                                                >
                                                                    <span
                                                                        className={classNames(
                                                                            isCurrent
                                                                                ? 'border-indigo-600 text-indigo-600 dark:border-white/20 dark:text-white'
                                                                                : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white',
                                                                            'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5',
                                                                        )}
                                                                    >
                                                                        {(place.name?.[0] || '?').toUpperCase()}
                                                                    </span>
                                                                    <span className="truncate">{place.name}</span>
                                                                </Link>
                                                            </li>
                                                        )
                                                    })
                                                )}
                                            </ul>
                                        </li>
                                        <li className="pb-4 mt-auto">
                                            <div className="px-2 mt-3">
                                                <LogoutButton widthFull />
                                            </div>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>

                {/* Static sidebar for desktop */}
                <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                    {/* Sidebar component, swap this element with another sidebar if you like */}
                    <div className="relative flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-white/10 dark:bg-gray-900 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                        <div className="relative flex h-16 shrink-0 items-center">
                            <Image
                                alt={t('brandAlt')}
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-8 dark:hidden"
                                width={32}
                                height={32}
                            />
                            <Image
                                alt={t('brandAlt')}
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                                className="h-8 w-8 not-dark:hidden"
                                width={32}
                                height={32}
                            />
                        </div>
                        <nav className="relative flex flex-1 flex-col">
                            <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                <li>
                                    <ul role="list" className="-mx-2 space-y-1">
                                        {navigation.map((item) => {
                                            const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`)
                                            return (
                                                <li key={item.key}>
                                                    <Link
                                                        href={item.href}
                                                        className={classNames(
                                                            isCurrent
                                                                ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                        )}
                                                    >
                                                        <item.icon
                                                            aria-hidden="true"
                                                            className={classNames(
                                                                isCurrent
                                                                    ? 'text-indigo-600 dark:text-white'
                                                                    : 'text-gray-400 group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-white',
                                                                'size-6 shrink-0',
                                                            )}
                                                        />
                                                        {t(`nav.${item.key}`)}
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </li>
                                <li>
                                    <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">{t('yourPlaces')}</div>
                                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                                        {loadingPlaces && places.length === 0 ? (
                                            <li className="px-2 text-sm text-gray-400">{t('loading')}</li>
                                        ) : places.length === 0 ? (
                                            <li className="px-2 text-sm text-gray-400">{t('noPlaces')}</li>
                                        ) : (
                                            places.map((place) => {
                                                const isCurrent = pathname === placeLink(place.id) || pathname.startsWith(`${placeLink(place.id)}/`)
                                                return (
                                                    <li key={place.id}>
                                                        <Link
                                                            href={placeLink(place.id)}
                                                            className={classNames(
                                                                isCurrent
                                                                    ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                                                            )}
                                                        >
                                                            <span
                                                                className={classNames(
                                                                    isCurrent
                                                                        ? 'border-indigo-600 text-indigo-600 dark:border-white/20 dark:text-white'
                                                                        : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:text-white',
                                                                    'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-white/5',
                                                                )}
                                                            >
                                                                {(place.name?.[0] || '?').toUpperCase()}
                                                            </span>
                                                            <span className="truncate">{place.name}</span>
                                                        </Link>
                                                    </li>
                                                )
                                            })
                                        )}
                                    </ul>
                                </li>
                                <li className="pb-4 mt-auto">
                                    <div className="px-2 mt-3">
                                        <LogoutButton widthFull />
                                    </div>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div
                    ref={headerRef}
                    className="sticky top-0 z-50 flex items-center gap-x-6 bg-white px-4 py-4 safe-top shadow-xs sm:px-6 lg:hidden dark:bg-gray-900  dark:shadow-none dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:border-b dark:before:border-white/10 dark:before:bg-black/10"
                >
                    <div className='mt-4 flex gap-x-6 items-center w-full'>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="relative -m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-400"
                        >
                            <span className="sr-only">{t('openSidebar')}</span>
                            <Bars3Icon aria-hidden="true" className="size-6" />
                        </button>
                        <div className="relative flex-1 text-sm/6 font-semibold text-gray-900 dark:text-white">{title ?? t('dashboard')}</div>
                        <a href="#" className="relative">
                            <span className="sr-only">{t('yourProfile')}</span>

                            {/* Avatar or initials */}
                            {me?.avatarUrl && !avatarError ? (
                                <Image
                                    alt={me?.name ?? 'User avatar'}
                                    src={me.avatarUrl}
                                    className="w-8 h-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
                                    width={32}
                                    height={32}
                                    unoptimized
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div
                                    className="size-8 rounded-full bg-indigo-600 text-white outline -outline-offset-1 outline-black/5 dark:bg-indigo-500 dark:outline-white/10 flex items-center justify-center text-xs font-semibold"
                                    aria-hidden="true"
                                >
                                    {getInitials(me?.name ?? null, me?.email ?? null)}
                                </div>
                            )}
                        </a>
                    </div>
                </div>

                {/* scroll-pt variable ensures programmatic focus / anchor jumps account for sticky header */}
                <main className="lg:pl-72 scroll-pt-[var(--app-header-height)]">
                    <div className="">
                        <div className="">
                            {children}
                        </div>
                    </div>
                </main>

                {/* <aside className="fixed inset-y-0 right-0 hidden w-96 overflow-y-auto border-l border-gray-200 px-4 py-6 sm:px-6 lg:px-8 xl:block dark:border-white/10">
                    {secondary}
                </aside> */}
            </div>
        </>
    )
}

export default AdminLayout;