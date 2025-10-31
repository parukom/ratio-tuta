"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowUpCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations, useLocale } from 'next-intl';

type Metric = {
  key: string;
  label: string;
  value: number;
  limit: number | null;
};

export const TeamUsageCards: React.FC = () => {
  const t = useTranslations('Reports');
  const locale = useLocale();
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  // const [teamName, setTeamName] = React.useState<string>('');
  const [packageName, setPackageName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/reports/team-usage', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        const m: Metric[] = [
          { key: 'members', label: t('metrics.members'), value: data.members, limit: data.membersLimit },
          { key: 'places', label: t('metrics.places'), value: data.places, limit: data.placesLimit },
          { key: 'items', label: t('metrics.items'), value: data.items, limit: data.itemsLimit },
          { key: 'receipts30d', label: t('metrics.receipts30d'), value: data.receipts30d, limit: data.receipts30dLimit },
        ];
        setMetrics(m);
        // setTeamName(data.teamName);
        setPackageName(data.packageName);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [t]);

  if (loading) return <div className="text-sm text-gray-500">{t('loading.usage')}</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!metrics.length) return <div className="text-sm text-gray-500">{t('errors.noData')}</div>;

  return (
    <div className="space-y-4">
      {/* Package Info Banner */}
      <div className="relative overflow-hidden flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 shadow-lg">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-white/90 mb-1">
            {t('currentPlan')}
          </p>
          <p className="text-2xl font-bold text-white">
            {packageName || 'FREE'}
          </p>
        </div>
        <Link
          href={`/${locale}/pricing`}
          className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold text-sm transition-all shadow-md hover:shadow-xl transform hover:scale-105"
        >
          <ArrowUpCircleIcon className="h-5 w-5" />
          {t('upgradePackage')}
        </Link>
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(m => {
          const effectiveLimit = (m.key === 'members' && m.limit == null ? 2 : (m.key === 'places' && m.limit == null ? 1 : m.limit)); // fallback for free tier
          const hasLimit = effectiveLimit != null;
          const percent = hasLimit ? Math.min(100, Math.round((m.value / (effectiveLimit || 1)) * 100)) : null;
          return (
            <div key={m.key} className="group relative p-5 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:border-indigo-200 dark:hover:border-indigo-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{m.label}</span>
                {packageName && m.key === 'members' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-medium">{packageName}</span>
                ) : null}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-baseline gap-2 mb-2">
                <span>{m.value}</span>
                {hasLimit ? (
                  <span className="text-gray-400 dark:text-gray-500 text-lg font-normal">/ {effectiveLimit}</span>
                ) : null}
              </div>
              {hasLimit ? (
                <>
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${percent! > 80 ? 'bg-red-500' : percent! > 60 ? 'bg-yellow-500' : 'bg-indigo-500 dark:bg-indigo-400'
                        }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {percent}% used
                  </p>
                </>
              ) : (
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('usage.unlimitedFeature')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamUsageCards;
