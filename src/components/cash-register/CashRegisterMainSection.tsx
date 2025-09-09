import React from 'react'
import Image from 'next/image';
import SearchInput from '../ui/SearchInput';
import { VariantChild, VariantGroup } from './SelectVariantModal';
import { GroupedPlaceItem } from '@/types/cash-register';

type RegisterMainProps = {
    error: string | null;
    search: string;
    setSearch: (value: React.SetStateAction<string>) => void
    visiblePlaceItems: GroupedPlaceItem[]
    currency: string;
    setActiveGroup: (value: React.SetStateAction<VariantGroup | null>) => void
    setOpenVariant: (value: React.SetStateAction<boolean>) => void
}

export const CashRegisterMainSection: React.FC<RegisterMainProps> = ({
    error,
    search,
    setSearch,
    visiblePlaceItems,
    currency,
    setActiveGroup,
    setOpenVariant
}) => {
    return (
        <main className="flex-grow overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {error && (
                <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/40">
                    {error}
                </div>
            )}
            <div className="mb-4">
                <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    containerClassName="w-full"
                    inputClassName="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 pl-9"
                />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {visiblePlaceItems.map((pi) => (
                    <div
                        key={pi.key}
                        className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow dark:border-white/10 dark:bg-gray-800/50"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            const vg: VariantGroup = {
                                key: pi.key,
                                name: pi.name,
                                color: pi.color,
                                price: pi.price,
                                quantity: pi.quantity,
                                items: pi.items as unknown as VariantChild[],
                            };
                            setActiveGroup(vg);
                            setOpenVariant(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                const vg: VariantGroup = {
                                    key: pi.key,
                                    name: pi.name,
                                    color: pi.color,
                                    price: pi.price,
                                    quantity: pi.quantity,
                                    items: pi.items as unknown as VariantChild[],
                                };
                                setActiveGroup(vg);
                                setOpenVariant(true);
                            }
                        }}
                    >
                        <div className="h-24 w-full bg-gray-100 dark:bg-white/5 relative">
                            <Image
                                src={pi.image ?? '/images/no-image.jpg'}
                                alt={pi.name}
                                priority
                                fill
                                sizes='100%'
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-200 ease-in-out group-hover:scale-110"
                            />
                        </div>
                        <div className="p-3">
                            <div className="mb-1 flex items-center gap-2">
                                {pi.color ? (
                                    <span
                                        className="inline-block h-4 w-4 rounded ring-1 ring-inset ring-gray-200 dark:ring-white/10"
                                        style={{ backgroundColor: pi.color || undefined }}
                                        aria-label="Color"
                                    />
                                ) : null}
                                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{pi.name}</h3>
                            </div>
                            <div className="mb-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                    {currency} {pi.price.toFixed(2)}
                                </span>
                                <span>Stock: {pi.quantity}</span>
                            </div>
                            {/* Sizes preview */}
                            {pi.items.some((c) => c.size) && (
                                <div className="mb-1 flex flex-wrap gap-1">
                                    {[...new Set(pi.items.map((c) => c.size).filter(Boolean) as string[])].slice(0, 5).map((sz) => (
                                        <span key={sz} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
                                            {sz}
                                        </span>
                                    ))}
                                    {new Set(pi.items.map((c) => c.size).filter(Boolean)).size > 5 && (
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">…</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
