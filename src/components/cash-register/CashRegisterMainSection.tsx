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
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {visiblePlaceItems.map((pi) => (
                    <div
                        key={pi.key}
                        className="group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm transition hover:shadow-md dark:border-white/10"
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
                        {/* Background image card */}
                        <div className="relative aspect-[3/4] w-full bg-gray-100 dark:bg-white/5">
                            <Image
                                src={pi.image ?? '/images/no-image.jpg'}
                                alt={pi.name}
                                fill
                                priority={false}
                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                                style={{ objectFit: 'cover' }}
                                className="transition-transform duration-200 ease-in-out group-hover:scale-[1.03]"
                            />

                            {/* Overlay gradient for readability */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/100 via-black/70 to-transparent" />

                            {/* Footer content overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2">
                                <div className="flex items-end justify-between gap-1">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                            {pi.color ? (
                                                <span
                                                    className="hidden sm:inline-block h-3 w-3 rounded ring-1 ring-inset ring-white/30"
                                                    style={{ backgroundColor: pi.color || undefined }}
                                                    aria-label="Color"
                                                />
                                            ) : null}
                                            <h3 className="truncate text-[11px] font-medium text-white drop-shadow sm:text-xs">
                                                {pi.name}
                                            </h3>
                                        </div>
                                        {/* Sizes preview on larger screens only */}
                                        {pi.items.some((c) => c.size) && (
                                            <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                                                {(() => {
                                                    const uniqueSizes = Array.from(
                                                        new Set(pi.items.map((c) => c.size).filter(Boolean) as string[])
                                                    );
                                                    uniqueSizes.sort((a, b) => {
                                                        const na = parseFloat(String(a).replace(',', '.'));
                                                        const nb = parseFloat(String(b).replace(',', '.'));
                                                        const aIsNum = !Number.isNaN(na);
                                                        const bIsNum = !Number.isNaN(nb);
                                                        if (aIsNum && bIsNum) return na - nb;
                                                        if (aIsNum) return -1; // numeric sizes come before non-numeric
                                                        if (bIsNum) return 1;
                                                        return String(a).localeCompare(String(b));
                                                    });
                                                    const shown = uniqueSizes.slice(0, 4);
                                                    return (
                                                        <>
                                                            {shown.map((sz) => (
                                                                <span
                                                                    key={sz}
                                                                    className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/90 ring-1 ring-inset ring-white/30 backdrop-blur-sm"
                                                                >
                                                                    {sz}
                                                                </span>
                                                            ))}
                                                            {uniqueSizes.length > 4 && (
                                                                <span className="text-[10px] text-white/80">…</span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end text-white">
                                        <span className="text-[11px] font-semibold sm:text-xs">
                                            {currency} {pi.price.toFixed(2)}
                                        </span>
                                        {(() => {
                                            const anyWeight = pi.items.some((c) => c.measurementType === 'WEIGHT')
                                            const anyLength = pi.items.some((c) => c.measurementType === 'LENGTH')
                                            const formatWeight = (grams: number) => {
                                                if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`
                                                return `${grams} g`
                                            }
                                            const text = anyWeight
                                                ? formatWeight(pi.quantity)
                                                : anyLength
                                                    ? `${pi.quantity} m`
                                                    : `${pi.quantity}`
                                            return (
                                                <span className="mt-0.5 rounded bg-black/40 px-1 py-0.5 text-[9px] leading-none ring-1 ring-white/20 backdrop-blur-sm">
                                                    Stock: {text}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
