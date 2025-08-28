'use client'
import AdminLayout from '@/components/layout/AdminLayout'
import { useRouter, useSearchParams } from 'next/navigation'
import SecondaryNav from '@/components/admin-zone/places/SecondaryNav'
import Logs from '@/components/admin-zone/Logs'
import Places from '@/components/admin-zone/Places'
import SearchInput from '@/components/ui/SearchInput'

const Home = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tab = (searchParams.get('tab') ?? 'places') as 'places' | 'logs'
    const setTab = (t: 'logs' | 'places') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '')
        params.set('tab', t)
        router.push(`?${params.toString()}`)
    }

    return (
        <>
            <AdminLayout>
                <div>
                    <div className="">
                        {/* Sticky search header */}
                        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white px-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
                            <SearchInput />
                        </div>

                        <main>
                            <header>
                                <SecondaryNav tab={tab} setTab={setTab} />
                            </header>

                            {/* Tab content */}
                            {tab === 'logs' && (
                                <Logs />
                            )}

                            {tab === 'places' && (
                                <Places />
                            )}
                        </main>
                    </div>
                </div>
            </AdminLayout>
        </>
    )
}
export default Home;