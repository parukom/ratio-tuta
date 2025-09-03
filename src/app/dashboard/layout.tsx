import { ReactNode } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { getSession } from '@lib/session'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getSession()
    if (!session) redirect('/auth?form=login')

    return (
        <SessionProvider value={session}>
            <AdminLayout>
                {children}
            </AdminLayout>
        </SessionProvider>
    )
}
