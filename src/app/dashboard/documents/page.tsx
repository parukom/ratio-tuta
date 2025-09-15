"use client";
import Tabs from "@/components/ui/Tabs";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SearchInput from "@/components/ui/SearchInput";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import BottomPaginationBar from "@/components/ui/BottomPaginationBar";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/modals/Modal";
import { useTranslations } from "next-intl";
import ReceiptsListTable, { ReceiptListItem } from '@/components/admin-zone/documents/ReceiptsListTable';
import AdminHeader from "@/components/layout/AdminHeader";

type ReceiptItem = {
    id: string;
    itemId: string;
    title: string;
    price: number;
    quantity: number;
};

type Receipt = {
    id: string;
    placeId: string | null;
    totalPrice: number;
    amountGiven: number;
    change: number;
    paymentOption: 'CASH' | 'CARD' | 'REFUND';
    status: string;
    createdAt?: string;
    timestamp?: string;
    items: ReceiptItem[];
};

const ReceiptsTab: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const q = searchParams.get('search') ?? '';
    const t = useTranslations('Documents');
    const paymentLabels: Record<Receipt['paymentOption'], string> = {
        CASH: t('payments.CASH'),
        CARD: t('payments.CARD'),
        REFUND: t('payments.REFUND'),
    };
    const [data, setData] = useState<Receipt[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Receipt | null>(null);
    const [reveal, setReveal] = useState(false);
    const fadeCls = `transition-opacity duration-1000 ${reveal ? 'opacity-100' : 'opacity-0'}`;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                params.set('limit', '25');
                params.set('page', String(page));
                if (q) params.set('q', q);
                const res = await fetch(`/api/receipts?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to load receipts');
                const json: unknown = await res.json();
                if (!cancelled && json && typeof json === 'object' && json !== null) {
                    const obj = json as Record<string, unknown>;
                    const rows = Array.isArray(obj.data) ? (obj.data as Receipt[]) : Array.isArray(json) ? (json as Receipt[]) : [];
                    const count = typeof obj.total === 'number' ? obj.total : rows.length;
                    setData(rows);
                    setTotal(count);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error';
                if (!cancelled) setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, q]);

    // trigger fade after data loads
    useEffect(() => {
        if (!loading) {
            setReveal(false);
            const t = window.setTimeout(() => setReveal(true), 50);
            return () => window.clearTimeout(t);
        }
    }, [loading, data.length]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 25)), [total]);

    const setPage = (p: number) => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('page', String(p));
        router.push(`?${params.toString()}`);
    };

    return (
        <div>
            <div className="px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="my-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/40">
                        {error}
                    </div>
                )}
                <div className="mt-4 overflow-hidden">
                    <ReceiptsListTable
                        data={data as unknown as ReceiptListItem[]}
                        loading={loading}
                        t={t}
                        fadeCls={fadeCls}
                        setSelected={(r) => setSelected(r as Receipt)}
                        paymentLabels={paymentLabels}
                    />
                </div>

                {/* Pagination spacer */}
            </div>
            <div aria-hidden className="h-16" />

            {/* Fixed bottom pagination bar */}
            <BottomPaginationBar
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage(Math.max(1, page - 1))}
                onNext={() => setPage(page + 1)}
                disabled={loading}
                includeSidebarInset
                prevLabel={t('pagination.prev')}
                nextLabel={t('pagination.next')}
            />
            {/* Details Modal */}
            <Modal size="xl" open={!!selected} onClose={() => setSelected(null)}>
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('modal.receipt')}</h2>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('modal.id')}: {selected.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.date')}</div>
                                <div className="text-gray-900 dark:text-white">
                                    <time dateTime={(selected.createdAt ?? selected.timestamp ?? '') as string}>
                                        {new Date(selected.createdAt ?? selected.timestamp ?? '').toLocaleString()}
                                    </time>
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.status')}</div>
                                <div className="text-gray-900 dark:text-white">{selected.status}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">{t('modal.payment')}</div>
                                <div className="text-gray-900 dark:text-white">{paymentLabels[selected.paymentOption]}</div>
                            </div>
                            {selected.placeId && (
                                <div>
                                    <div className="text-gray-500 dark:text-gray-400">{t('modal.place')}</div>
                                    <div className="text-gray-900 dark:text-white">{selected.placeId}</div>
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-md border border-gray-200 dark:border-white/10">
                            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
                                <thead className="bg-gray-50 text-gray-900 dark:bg-white/5 dark:text-white">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">{t('modal.item')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.price')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.qty')}</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('modal.total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                    {selected.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-3 py-2 text-gray-900 dark:text-white">{it.title}</td>
                                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">EUR {it.price.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{it.quantity}</td>
                                            <td className="px-3 py-2 text-right text-gray-900 dark:text-white">EUR {(it.price * it.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="">
                            <div className="w-full space-y-1 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('modal.subtotal')}</span>
                                    <span className="text-gray-900 dark:text-white">EUR {selected.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('modal.amountGiven')}</span>
                                    <span className="text-gray-900 dark:text-white">EUR {selected.amountGiven.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{t('modal.change')}</span>
                                    <span className="text-gray-900 dark:text-white">EUR {selected.change.toFixed(2)}</span>
                                </div>
                                <div className="mt-2 border-t border-gray-200 pt-2 dark:border-white/10" />
                                <div className="flex items-center justify-between text-base font-semibold">
                                    <span className="text-gray-900 dark:text-white">{t('modal.total')}</span>
                                    <span className="text-gray-900 dark:text-white">EUR {selected.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

const BlankTab: React.FC = () => {
    const t = useTranslations('Documents');
    return <div className="p-4 text-gray-600 dark:text-gray-400">{t('blank.empty')}</div>;
};

const DocumentsInner: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('Documents');
    const tab = (searchParams.get('tab') ?? 'receipts') as 'receipts' | 'blank';
    const q = searchParams.get('search') ?? '';
    const setTab = (tKey: 'receipts' | 'blank') => {
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('tab', tKey);
        router.push(`?${params.toString()}`);
    };

    return (
        <main>
            {/* Sticky search header — align with Home */}
            <div className="sticky top-0 z-40 flex w-full h-16 items-center justify-between border-b border-gray-200 bg-gradient-to-t from-white to-gray-50 px-4 safe-top shadow-xs dark:border-white/10 dark:bg-gradient-to-t dark:from-gray-900 dark:to-gray-900 dark:shadow-none">
                <AdminHeader
                    left={
                        <SearchInput
                            value={q}
                            onChange={(e) => {
                                const params = new URLSearchParams(searchParams?.toString() ?? '')
                                const val = e.target.value
                                if (val) params.set('search', val); else params.delete('search')
                                // reset to first page on search change
                                params.set('page', '1')
                                router.push(`?${params.toString()}`)
                            }}
                            placeholder={t('searchPlaceholder', { default: 'Search receipts' })}
                            containerClassName="w-full"
                            inputClassName="block w-full rounded-md bg-white py-1.5 pl-8 pr-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 sm:text-sm/6"
                        />
                    }
                    right={null}
                />
            </div>

            {/* Breadcrumbs — same container spacing as Home */}
            <header className="p-4">
                <Breadcrumbs
                    items={[
                        { name: tab === 'receipts' ? t('tabs.receipts') : t('tabs.blank') },
                    ]}
                />
            </header>

            {/* Tabs below breadcrumbs */}
            <div className="py-4 border-y border-gray-200 dark:border-white/10">
                <Tabs
                    items={[
                        { key: 'receipts', label: t('tabs.receipts') },
                        { key: 'blank', label: t('tabs.blank') },
                    ]}
                    activeKey={tab}
                    onChange={(k) => setTab(k as 'receipts' | 'blank')}
                />
            </div>

            {/* Content */}
            {tab === 'receipts' && <ReceiptsTab />}
            {tab === 'blank' && <BlankTab />}
        </main>
    );
};

export default function Page() {
    return (
        <Suspense>
            <DocumentsInner />
        </Suspense>
    );
}

