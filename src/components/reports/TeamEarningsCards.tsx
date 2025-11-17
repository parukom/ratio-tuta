"use client";
import React from 'react';
import {
  BanknotesIcon,
  CreditCardIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

type EarningsData = {
  teamName: string;
  totalEarningsCash: number;
  totalEarningsCard: number;
  totalEarningsAll: number;
};

export const TeamEarningsCards: React.FC = () => {
  const t = useTranslations('Reports');
  const [data, setData] = React.useState<EarningsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/reports/team-earnings', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        if (!alive) return;
        setData(json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">{t('loading.earnings', { default: 'Loading earnings...' })}</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return <div className="text-sm text-gray-500">{t('errors.noData')}</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('earnings.title', { default: 'Lifetime Earnings' })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('earnings.subtitle', { default: 'All-time earnings across all locations' })}
          </p>
        </div>
      </div>

      {/* Earnings Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
        {/* Total Earnings - Featured Card */}
        <div className="group relative p-6 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] rounded-xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CurrencyEuroIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-semibold text-white/90">
                {t('earnings.total', { default: 'Total Earnings' })}
              </span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {formatCurrency(data.totalEarningsAll)}
            </div>
            <p className="text-sm text-white/70">
              {t('earnings.allTime', { default: 'All payment methods' })}
            </p>
          </div>
        </div>

        {/* Cash Earnings */}
        <div className="group relative p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:border-green-200 dark:hover:border-green-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('earnings.cash', { default: 'Cash' })}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatCurrency(data.totalEarningsCash)}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 dark:bg-green-400 transition-all duration-500"
              style={{
                width: `${data.totalEarningsAll > 0 ? (data.totalEarningsCash / data.totalEarningsAll) * 100 : 0}%`
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {data.totalEarningsAll > 0 ? Math.round((data.totalEarningsCash / data.totalEarningsAll) * 100) : 0}% of total
          </p>
        </div>

        {/* Card Earnings */}
        <div className="group relative p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('earnings.card', { default: 'Card' })}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatCurrency(data.totalEarningsCard)}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{
                width: `${data.totalEarningsAll > 0 ? (data.totalEarningsCard / data.totalEarningsAll) * 100 : 0}%`
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {data.totalEarningsAll > 0 ? Math.round((data.totalEarningsCard / data.totalEarningsAll) * 100) : 0}% of total
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <span className="font-semibold">💡 {t('earnings.note.title', { default: 'Note:' })}</span>{' '}
          {t('earnings.note.description', { default: 'These are lifetime earnings that persist even when locations are deleted. Refunds are automatically subtracted.' })}
        </p>
      </div>
    </div>
  );
};

export default TeamEarningsCards;
