'use client'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl'
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import Logo from './ui/Logo';

// Type for session data (keeping it simple)
type SessionData = {
    userId: string;
    name: string;
    role: 'USER' | 'ADMIN';
} | null;

type FirstPagesHeaderProps = {
    session?: SessionData;
}

export const FirstPagesHeader = ({ session = null }: FirstPagesHeaderProps) => {
    const t = useTranslations('Home')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navigation = [
        { name: t('hero.nav.features'), href: '#features', disabled: true },
        { name: t('hero.nav.howItWorks'), href: '#how-it-works', disabled: true },
        { name: 'Docs', href: '/docs', disabled: false },
        { name: t('hero.nav.pricing'), href: '/pricing', disabled: false },
        { name: t('hero.nav.contact'), href: '#', disabled: true },
    ]
    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5 text-lg font-semibold text-gray-900 dark:text-white">
                        <Logo />
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => {
                        const tooltipId = `nav-tooltip-${item.name.replace(/\s+/g, '-')}`
                        return (
                            <div key={item.name} className="relative group">
                                {item.disabled ? (
                                    <button
                                        type="button"
                                        disabled={item.disabled}
                                        aria-describedby={item.disabled ? tooltipId : undefined}
                                        onClick={() => { }}
                                        className={`text-sm/6 font-semibold text-gray-900 dark:text-white ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {item.name}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="text-sm/6 font-semibold text-gray-900 dark:text-white"
                                    >
                                        {item.name}
                                    </Link>
                                )}

                                {item.disabled && (
                                    <div
                                        id={tooltipId}
                                        role="tooltip"
                                        className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 w-max rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700"
                                    >
                                        This section is under construction.
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div className="hidden lg:flex lg:items-center lg:gap-4 lg:flex-1 lg:justify-end">
                    <LanguageSwitcher />
                    {session ? (
                        <Link
                            href="/dashboard/home"
                            className="flex items-center gap-2 text-sm/6 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/auth" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
                            Log in <span aria-hidden="true">&rarr;</span>
                        </Link>
                    )}
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:bg-gray-900 dark:sm:ring-gray-100/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5 text-lg font-semibold text-gray-900 dark:text-white">
                            <Logo />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-200"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10 dark:divide-white/10">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => {
                                    const tooltipId = `mobile-nav-tooltip-${item.name.replace(/\s+/g, '-')}`
                                    return (
                                        <div key={item.name} className="relative group">
                                            {item.disabled ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    aria-describedby={tooltipId}
                                                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5 opacity-50 cursor-not-allowed"
                                                >
                                                    {item.name}
                                                </button>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                                                >
                                                    {item.name}
                                                </Link>
                                            )}

                                            {item.disabled && (
                                                <div
                                                    id={tooltipId}
                                                    role="tooltip"
                                                    className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 w-max rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700"
                                                >
                                                    This page is under construction.
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="py-6">
                                <div className="px-3 pb-4">
                                    <LanguageSwitcher className="w-full" side="top" align="left" />
                                </div>
                                {session ? (
                                    <Link
                                        href="/dashboard/home"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                                    >
                                        <LayoutDashboard size={18} />
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href="/auth?form=login"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
                                    >
                                        Log in
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}
