import AdminHeader from '@/components/layout/AdminHeader';
import RoundChart from '@/components/reports/charts/RoundChart';
import TeamUsageCards from '@/components/reports/TeamUsageCards';
import SalesReport from '@/components/reports/SalesReport';
import React from 'react';
import { useTranslations } from 'next-intl';

const ReportsPage = () => {
    const t = useTranslations('Reports');

    return (
        <div className="flex flex-col flex-1 w-full h-full overflow-auto">
            {/* Header Section */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <AdminHeader title={t('title')} subtitle={t('subtitle')} />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 space-y-6">
                {/* Sales Report Section */}
                <SalesReport />

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                {/* Usage Metrics Cards - Full Width */}
                <TeamUsageCards />

                {/* Chart Section - Full Width */}
                <div className="w-full">
                    <RoundChart />
                </div>
            </div>
        </div>
    )
}
export default ReportsPage;