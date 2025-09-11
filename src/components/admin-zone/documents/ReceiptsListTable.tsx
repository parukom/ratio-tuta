"use client";
import React from 'react';
import Spinner from '@/components/ui/Spinner';

// Minimal structural types for the table — keeps component decoupled from page-specific types
export type ReceiptListItem = {
    id: string;
    createdAt?: string;
    timestamp?: string;
    paymentOption: 'CASH' | 'CARD' | 'REFUND' | string; // allow forward compatibility
    totalPrice: number;
    items: { id?: string; itemId?: string; title: string; quantity: number; price?: number }[];
};

type TranslationValues = Record<string, string | number | boolean | null | undefined> | undefined;

export interface ReceiptsListTableProps {
    data: ReceiptListItem[];
    loading: boolean;
    // Translation function (next-intl compatible subset)
    t: (key: string, values?: TranslationValues) => string;
    fadeCls: string;
    setSelected: (r: ReceiptListItem) => void;
    paymentLabels: Record<string, string>;
    className?: string;
}

const ReceiptsListTable: React.FC<ReceiptsListTableProps> = ({
    data,
    loading,
    t,
    fadeCls,
    setSelected,
    paymentLabels,
    className = ''
}) => {
    // Common formatting logic extracted so we can reuse for mobile cards & table rows
    const formatRecord = (r: ReceiptListItem) => {
        const dtRaw = r.createdAt ?? r.timestamp ?? '';
        let formatted = '';
        try { formatted = dtRaw ? new Date(dtRaw).toLocaleString() : ''; } catch { formatted = dtRaw; }
        const payment = paymentLabels[r.paymentOption] ?? r.paymentOption;
        const itemsLine = r.items.map((it) => `${it.title}×${it.quantity}`).join(', ');
        return { dtRaw, formatted, payment, itemsLine };
    };

    // Loading & empty states reused
    const LoadingState = (
        <div className="flex items-center justify-center py-10">
            <Spinner size={28} className="text-gray-400 dark:text-white/40" />
        </div>
    );

    const EmptyState = (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-white/50">
            {t('list.empty')}
        </div>
    );

    return (
        <div className={`w-full ${className}`}>
            {/* Mobile (card) view */}
            <div className="md:hidden space-y-3">
                {loading ? LoadingState : data.length === 0 ? EmptyState : (
                    <ul className="space-y-3">
                        {data.map((r) => {
                            const { dtRaw, formatted, payment, itemsLine } = formatRecord(r);
                            return (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(r)}
                                        className="group w-full text-left rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 px-4 py-3"
                                        aria-label={t('list.openReceipt', { id: r.id })}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-[13px] font-medium text-gray-900 dark:text-white mb-1 ${fadeCls}`}>
                                                    <time dateTime={dtRaw}>{formatted}</time>
                                                </div>
                                                <div className={`flex flex-wrap gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400 ${fadeCls}`}>
                                                    <span>{payment}</span>
                                                    <span className="text-gray-300 dark:text-white/20">•</span>
                                                    <span className="text-gray-700 dark:text-gray-300 normal-case font-normal truncate max-w-full">{itemsLine}</span>
                                                </div>
                                            </div>
                                            <div className={`shrink-0 text-right ${fadeCls}`}>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">EUR {r.totalPrice.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Desktop / larger screens table view */}
            <div className="hidden md:block rounded-xl border border-gray-200/80 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                        <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-900 dark:text-white">
                            <tr className="*:[&>th]:first:pl-5">
                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{t('table.headers.date')}</th>
                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{t('table.headers.payment')}</th>
                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{t('table.headers.total')}</th>
                                <th className="px-4 py-3 text-left font-semibold min-w-[320px]">{t('table.headers.items')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                            {loading ? (
                                <tr>
                                    <td className="px-4 py-10" colSpan={4}>{LoadingState}</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td className="px-4" colSpan={4}>{EmptyState}</td>
                                </tr>
                            ) : (
                                data.map((r) => {
                                    const { dtRaw, formatted, payment, itemsLine } = formatRecord(r);
                                    return (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-gray-50/70 dark:hover:bg-white/10 cursor-pointer transition-colors focus-within:bg-gray-50/70 dark:focus-within:bg-white/10"
                                            onClick={() => setSelected(r)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelected(r);
                                                }
                                            }}
                                            aria-label={t('list.openReceipt', { id: r.id })}
                                        >
                                            <td className="px-4 py-3 text-gray-900 dark:text-white align-top">
                                                <div className={fadeCls}>
                                                    <time dateTime={dtRaw}>{formatted}</time>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">
                                                <div className={fadeCls}>{payment}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 dark:text-white align-top">
                                                <div className={`${fadeCls} font-medium tabular-nums`}>EUR {r.totalPrice.toFixed(2)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[640px] align-top">
                                                <div className={`${fadeCls} truncate`}>{itemsLine}</div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceiptsListTable;
