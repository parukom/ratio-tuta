"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import SearchInput from '../ui/SearchInput';
import { Menu, Home } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/components/providers/SessionProvider';
import CashRegisterDrawer from './CashRegisterDrawer';

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
    const [open, setOpen] = React.useState(false);
    const session = useSession();
    return (
        <header className="sticky top-0 z-50 safe-top border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 py-2.5  dark:border-white/10 dark:bg-gray-900/80">
            <div className="flex items-center gap-2 sm:gap-3 mt-3">
                {session && session.role === 'ADMIN' ? (
                    <div className="shrink-0">
                        <Link href="/dashboard/home" aria-label="Dashboard" title="Dashboard">
                            <div className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white">
                                <Home className="size-5" aria-hidden="true" />
                            </div>
                        </Link>
                    </div>
                ) : null}

                {/* Search */}
                <div className="min-w-0 flex-1">
                    <SearchInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        containerClassName="w-full"
                        inputClassName="block w-full rounded-md bg-white px-4 py-2 text-sm text-gray-900 inset-ring-1 inset-ring-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/10 dark:text-white dark:inset-ring-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 pl-9"
                    />
                </div>

                {/* Burger */}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('filters', { default: 'Filters' })}
                    title={t('filters', { default: 'Filters' })}
                    className="shrink-0 inline-flex items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                    <Menu className="size-6" aria-hidden="true" />
                </button>
            </div>
            <CashRegisterDrawer
                open={open}
                onClose={() => setOpen(false)}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                sortKey={sortKey}
                setSortKey={setSortKey}
            />
        </header>
    );
};
