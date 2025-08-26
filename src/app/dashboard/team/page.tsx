import TeamTable from '@/components/admin-zone/members/TeamTable'
import AdminLayout from '@/components/layout/AdminLayout'
import { getSession } from '@lib/session'
import { redirect } from 'next/navigation'

export default async function Team() {
    const session = await getSession()
    if (!session) redirect('/auth')
    return (
        <AdminLayout>
            <TeamTable />
        </AdminLayout>
    )
}
