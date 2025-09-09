"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import LogoutButton from '../LogoutButton';
import SearchInput from '../ui/SearchInput';
import Dropdown from '../ui/Dropdown';

type Props = {
    search: string;
    setSearch: (value: React.SetStateAction<string>) => void;
    inStockOnly: boolean;
    setInStockOnly: (value: React.SetStateAction<boolean>) => void;
    sortKey: 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC';
    setSortKey: (value: React.SetStateAction<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC'>) => void;
};

export const CashRegisterHeader: React.FC<Props> = ({
    search,
    setSearch,
    inStockOnly,
    setInStockOnly,
    sortKey,
    setSortKey,
}) => {
    const t = useTranslations('CashRegister');
    const common = useTranslations('Common');
    const sortLabelMap: Record<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC', string> = {
        NAME_ASC: `${common('name', { default: 'Name' })} ↑`,
        PRICE_ASC: `${common('price', { default: 'Price' })} ↑`,
        PRICE_DESC: `${common('price', { default: 'Price' })} ↓`,
        STOCK_DESC: `${t('stock', { default: 'Stock' })} ↓`,
    };
    return (
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 shadow-xs sm:gap-3 sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
            <div className="order-1 basis-full min-w-0 sm:order-none sm:basis-auto sm:flex-1 flex items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    containerClassName="w-full"
                    inputClassName="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 pl-9"
                />
            </div>
            <div className="order-2 basis-full flex items-center justify-between gap-2 sm:order-none sm:basis-auto sm:justify-end sm:gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/10 dark:bg-white/5"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        aria-label={t('inStockOnly', { default: 'In stock only' })}
                        title={t('inStockOnly', { default: 'In stock only' })}
                    />
                    <span className="hidden sm:inline">{t('inStockOnly', { default: 'In stock only' })}</span>
                </label>
                <Dropdown
                    align="right"
                    buttonLabel={`${t('sort', { default: 'Sort' })}: ${sortLabelMap[sortKey]}`}
                    items={[
                        { key: 'NAME_ASC', label: sortLabelMap.NAME_ASC },
                        { key: 'PRICE_ASC', label: sortLabelMap.PRICE_ASC },
                        { key: 'PRICE_DESC', label: sortLabelMap.PRICE_DESC },
                        { key: 'STOCK_DESC', label: sortLabelMap.STOCK_DESC },
                    ]}
                    onSelect={(key) => setSortKey(key as typeof sortKey)}
                />
                <LogoutButton />
            </div>
        </header>
    );
};
