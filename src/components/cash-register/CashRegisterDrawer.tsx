"use client";
import React from 'react';
import Drawer from '@/components/ui/Drawer';
import { useTranslations } from 'next-intl';
import Dropdown from '@/components/ui/Dropdown';
import LogoutButton from '@/components/LogoutButton';
import { PackageCheck, SlidersHorizontal } from 'lucide-react';

type SortKey = 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC';

type Props = {
    open: boolean;
    onClose: () => void;
    inStockOnly: boolean;
    setInStockOnly: (value: React.SetStateAction<boolean>) => void;
    sortKey: SortKey;
    setSortKey: (value: React.SetStateAction<SortKey>) => void;
};

export default function CashRegisterDrawer({ open, onClose, inStockOnly, setInStockOnly, sortKey, setSortKey }: Props) {
    const t = useTranslations('CashRegister');
    const common = useTranslations('Common');
    const sortLabelMap: Record<SortKey, string> = {
        NAME_ASC: `${common('name', { default: 'Name' })} ↑`,
        PRICE_ASC: `${common('price', { default: 'Price' })} ↑`,
        PRICE_DESC: `${common('price', { default: 'Price' })} ↓`,
        STOCK_DESC: `${t('stock', { default: 'Stock' })} ↓`,
    };

    return (
        <Drawer open={open} onClose={onClose} side="right" title={t('filters', { default: 'Filters' })}>
            <div className="space-y-6 flex flex-col h-full justify-between">
                {/* Filters section */}
                <section className="space-y-6">
                    <section>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('filters', { default: 'Filters' })}
                        </h3>
                        <div className="space-y-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={inStockOnly}
                                onClick={() => setInStockOnly((v) => !v)}
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors
                ${inStockOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-white/10 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/15'}`}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <PackageCheck className="size-4" /> {t('inStockOnly', { default: 'In stock only' })}
                                </span>
                                <span className={`ml-2 inline-block h-5 w-9 rounded-full bg-gray-200 p-0.5 transition-colors ${inStockOnly ? 'bg-white/30' : ''}`}>
                                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${inStockOnly ? 'translate-x-4' : ''}`} />
                                </span>
                            </button>
                        </div>
                    </section>

                    {/* Sort section */}
                    <section>
                        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            <SlidersHorizontal className="size-4" /> {t('sort', { default: 'Sort' })}
                        </h3>
                        <Dropdown
                            align="left"
                            buttonLabel={`${t('sort', { default: 'Sort' })}: ${sortLabelMap[sortKey]}`}
                            items={[
                                { key: 'NAME_ASC', label: sortLabelMap.NAME_ASC },
                                { key: 'PRICE_ASC', label: sortLabelMap.PRICE_ASC },
                                { key: 'PRICE_DESC', label: sortLabelMap.PRICE_DESC },
                                { key: 'STOCK_DESC', label: sortLabelMap.STOCK_DESC },
                            ]}
                            onSelect={(key) => setSortKey(key as SortKey)}
                        />
                    </section>
                </section>

                {/* Logout */}
                <section>
                    <LogoutButton widthFull />
                </section>
            </div>
        </Drawer>
    );
}
