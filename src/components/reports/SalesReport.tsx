"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import {
  BanknotesIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type SalesData = {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  salesByDate: Array<{ date: string; revenue: number; count: number }>;
  topPaymentMethod: string;
  paymentBreakdown: Record<string, number>;
};

type Period = 'week' | 'month' | 'year';

export const SalesReport: React.FC = () => {
  const t = useTranslations('Reports.sales');
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/sales?period=${period}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch sales data');
      const result = await res.json();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-sm text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="text-sm text-red-600">{error || t('noData')}</div>
      </div>
    );
  }

  // Prepare chart data
  const chartDates = data.salesByDate.map((d) => d.date);
  const chartRevenues = data.salesByDate.map((d) => d.revenue);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
      },
    },
    colors: ['#6366f1'],
    xaxis: {
      categories: chartDates,
      labels: {
        style: {
          colors: '#9ca3af',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9ca3af',
        },
        formatter: (val: number) => `€${val.toFixed(0)}`,
      },
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `€${val.toFixed(2)}`,
      },
    },
  };

  const metrics = [
    {
      label: t('metrics.totalRevenue'),
      value: `€${data.totalRevenue.toFixed(2)}`,
      icon: BanknotesIcon,
      color: 'indigo',
    },
    {
      label: t('metrics.totalSales'),
      value: data.totalSales,
      icon: ShoppingCartIcon,
      color: 'green',
    },
    {
      label: t('metrics.averageOrder'),
      value: `€${data.averageOrderValue.toFixed(2)}`,
      icon: ChartBarIcon,
      color: 'purple',
    },
    {
      label: t('metrics.topPayment'),
      value: data.topPaymentMethod,
      icon: CreditCardIcon,
      color: 'pink',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {t(`periods.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="relative p-5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.label}
              </span>
              <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                <metric.icon className={`h-5 w-5 text-${metric.color}-600 dark:text-${metric.color}-400`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('chartTitle')}
        </h4>
        {data.salesByDate.length > 0 ? (
          <ReactApexChart
            options={chartOptions}
            series={[{ name: t('revenue'), data: chartRevenues }]}
            type="area"
            height={350}
          />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t('noSales')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
