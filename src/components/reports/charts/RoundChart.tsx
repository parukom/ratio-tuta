
"use client";
import React from 'react';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading chart...</div> });

type AggregatedApi = {
    members: number; membersLimit: number | null;
    places: number; placesLimit: number | null;
    items: number; itemsLimit: number | null;
    receipts30d: number; receipts30dLimit: number | null;
};
type ChartData = { labels: string[]; series: number[] };

const RoundChart: React.FC = () => {
    const [data, setData] = React.useState<ChartData | null>(null);
    // no separate ratio label state; incorporate used/limit directly into label text
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch('/api/reports/aggregated', { cache: 'no-store' });
                if (!res.ok) throw new Error(`Aggregated failed: ${res.status}`);
                const agg: AggregatedApi = await res.json();
                // Selected usage metrics (including places)
                const labels: string[] = [];
                const series: number[] = [];
                const fmt = (used: number, limit: number | null, name: string) => limit ? `${name} ${used}/${limit}` : `${name} ${used}`;
                labels.push(fmt(agg.members, agg.membersLimit, 'Members'));
                series.push(agg.membersLimit ? (agg.members / agg.membersLimit) * 100 : agg.members);
                labels.push(fmt(agg.places, agg.placesLimit, 'Places'));
                series.push(agg.placesLimit ? (agg.places / agg.placesLimit) * 100 : agg.places);
                labels.push(fmt(agg.items, agg.itemsLimit, 'Items'));
                series.push(agg.itemsLimit ? (agg.items / agg.itemsLimit) * 100 : agg.items);
                labels.push(fmt(agg.receipts30d, agg.receipts30dLimit, 'Receipts 30d'));
                series.push(agg.receipts30dLimit ? (agg.receipts30d / agg.receipts30dLimit) * 100 : agg.receipts30d);
                if (alive) setData({ labels, series });
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed to load';
                if (alive) setError(msg);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    if (loading) return <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow-sm">Loading activity...</div>;
    if (error) return <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>;
    if (!data) return <div className="p-4 rounded-md bg-white dark:bg-gray-800">No data</div>;

    const options: ApexOptions = {
        chart: { type: 'radialBar', height: 390 },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                startAngle: 0,
                endAngle: 270,
                hollow: { margin: 5, size: '30%', background: 'transparent' },
                dataLabels: { name: { show: false }, value: { show: false } },
                barLabels: {
                    enabled: true,
                    useSeriesColors: true,
                    offsetX: -8,
                    fontSize: '12px',
                    formatter: function (originalLabel: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) {
                        const val = opts.w.globals.series[opts.seriesIndex];
                        const percent = val.toFixed(1).replace(/\.0$/, '');
                        // If label has used/limit pattern show percentage in parentheses
                        if (/\d+\/\d+/.test(originalLabel)) {
                            return `${originalLabel} (${percent}%)`;
                        }
                        return `${originalLabel}: ${percent}`;
                    }
                }
            }
        },
    colors: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'],
        labels: data.labels,
        responsive: [{
            breakpoint: 640,
            options: { legend: { show: false }, plotOptions: { radialBar: { barLabels: { fontSize: '10px' } } } }
        }]
    };

    return (
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">Team Usage</h3>
            <div>
                <ReactApexChart options={options} series={data.series} type="radialBar" height={390} />
            </div>
        </div>
    );
};

export default RoundChart;
