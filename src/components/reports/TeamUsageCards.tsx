"use client";
import React from 'react';

 type Metric = {
  key: string;
  label: string;
  value: number;
  limit: number | null;
 };

 export const TeamUsageCards: React.FC = () => {
  const [metrics, setMetrics] = React.useState<Metric[]>([]);
  const [teamName, setTeamName] = React.useState<string>('');
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
          { key: 'members', label: 'Members', value: data.members, limit: data.membersLimit },
          { key: 'places', label: 'Places', value: data.places, limit: data.placesLimit },
          { key: 'items', label: 'Items', value: data.items, limit: data.itemsLimit },
          { key: 'receipts30d', label: 'Receipts (30d)', value: data.receipts30d, limit: data.receipts30dLimit },
        ];
        setMetrics(m);
        setTeamName(data.teamName);
        setPackageName(data.packageName);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load';
        if (alive) setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading usage...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!metrics.length) return <div className="text-sm text-gray-500">No usage data.</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(m => {
  const effectiveLimit = (m.key === 'members' && m.limit == null ? 2 : (m.key === 'places' && m.limit == null ? 1 : m.limit)); // fallback for free tier
        const hasLimit = effectiveLimit != null;
        const percent = hasLimit ? Math.min(100, Math.round((m.value / (effectiveLimit || 1)) * 100)) : null;
        return (
          <div key={m.key} className="p-4 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{m.label}</span>
              {packageName && m.key === 'members' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">{packageName}</span>
              ) : null}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-baseline gap-1">
              <span>{m.value}</span>
              {hasLimit ? (
                <span className="text-gray-400 dark:text-gray-500 text-sm">/ {effectiveLimit}</span>
              ) : null}
            </div>
            <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {hasLimit ? (
                <span>{m.value} out of {effectiveLimit}</span>
              ) : (
                <span className="italic">{m.value} used (no limit)</span>
              )}
            </div>
            {hasLimit ? (
              <div className="mt-2 h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${percent}%` }} />
              </div>
            ) : (
              <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">Unlimited plan feature</div>
            )}
          </div>
        );
      })}
    </div>
  );
 };

 export default TeamUsageCards;
