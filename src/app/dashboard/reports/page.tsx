import AdminHeader from '@/components/layout/AdminHeader';
import RoundChart from '@/components/reports/charts/RoundChart';
import TeamUsageCards from '@/components/reports/TeamUsageCards';
import React from 'react'

const ReportsPage = () => {
    return (
        <div className="flex flex-col flex-1 items-start p-4 gap-6">
            <AdminHeader title="Reports" subtitle="Overview & Usage" />
            <div className="w-full max-w-5xl space-y-8">
                <RoundChart />
                <TeamUsageCards />
            </div>
        </div>
    )
}
export default ReportsPage;