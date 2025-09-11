'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import SearchInput from '@/components/ui/SearchInput'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import CreatePlaceButton from '@/components/admin-zone/places/CreatePlaceButton'
import Places from '@/components/admin-zone/Places'
import AdminHeader from '@/components/layout/AdminHeader'

const HomeInner = () => {
    const router = useRouter()
    const t = useTranslations('Home')
    const searchParams = useSearchParams()
    const tab = (searchParams.get('tab') ?? 'places') as 'places' | 'logs'
    const q = searchParams.get('search') ?? ''

    return (
        <>
            <div>
                <div className="">
                    {/* Sticky search header */}
                    <div className="sticky top-0 z-40 flex w-full h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-t from-white to-gray-50 px-4 safe-top shadow-xs dark:border-white/10 dark:bg-gradient-to-t dark:from-gray-900 dark:to-gray-900 dark:shadow-none">
                        <AdminHeader
                            left={
                                <SearchInput
                                    value={q}
                                    onChange={(e) => {
                                        const params = new URLSearchParams(searchParams?.toString() ?? '')
                                        const val = e.target.value
                                        if (val) params.set('search', val); else params.delete('search')
                                        router.push(`?${params.toString()}`)
                                    }}
                                    placeholder={t('searchPlaceholder', { default: 'Search' })}
                                    containerClassName="w-full"
                                    inputClassName="block w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 sm:text-sm/6"
                                />
                            }
                            right={
                                <CreatePlaceButton onCreated={(p) => {
                                    // Notify Places list to optimistically prepend the new place
                                    if (typeof window !== 'undefined') {
                                        window.dispatchEvent(new CustomEvent('place:created', {
                                            detail: { id: p.id, name: p.name },
                                        }))
                                    }
                                }} />
                            }
                        />

                    </div>
                    <main>
                        <header className='p-4'>
                            <Breadcrumbs
                                items={[
                                    { name: tab === 'places' ? t('breadcrumbs.places') : t('breadcrumbs.logs') },
                                ]}
                            />
                        </header>

                        {/* Content */}
                        <Places query={q} />
                    </main>
                </div>
            </div>
        </>
    )
}

export default function Home() {
    return (
        <Suspense>
            <HomeInner />
        </Suspense>
    )
}