import { ReactNode } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { getSession } from '@lib/session'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import DashboardIntlProvider from '../../components/providers/DashboardIntlProvider'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getSession()
    if (!session) {
        // Default to English for auth redirect - middleware will handle proper locale
        redirect('/en/auth?form=login')
    }
    if (session.role !== 'ADMIN') redirect('/dashboard/unallowed')

    return (
        <DashboardIntlProvider>
            <SessionProvider value={session}>
                <AdminLayout>
                    {children}
                </AdminLayout>
            </SessionProvider>
        </DashboardIntlProvider>
    )
}
