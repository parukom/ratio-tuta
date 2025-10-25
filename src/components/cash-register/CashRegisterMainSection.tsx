"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { VariantChild, VariantGroup } from './SelectVariantModal';
import Spinner from '@/components/ui/Spinner';
import { GroupedPlaceItem } from '@/types/cash-register';

type RegisterMainProps = {
    error: string | null;
    visiblePlaceItems: GroupedPlaceItem[]
    currency: string;
    setActiveGroup: (value: React.SetStateAction<VariantGroup | null>) => void
    setOpenVariant: (value: React.SetStateAction<boolean>) => void
    loading?: boolean
    reloading?: boolean
}

export const CashRegisterMainSection: React.FC<RegisterMainProps> = ({
    error,
    visiblePlaceItems,
    currency,
    setActiveGroup,
    setOpenVariant,
    loading = false,
    reloading = false,
}) => {
    const t = useTranslations('CashRegister');
    // control mounting and staggered appearance of cards
    const [contentMounted, setContentMounted] = useState(!loading);
    const [cardsVisible, setCardsVisible] = useState(!loading);

    useEffect(() => {
        let id: ReturnType<typeof setTimeout> | undefined;
        if (loading) {
            // hide content while loading
            setCardsVisible(false);
            // unmount after a short delay to avoid layout jank
            id = setTimeout(() => setContentMounted(false), 120);
        } else {
            // mount container immediately, then reveal cards with a small stagger delay
            setContentMounted(true);
            id = setTimeout(() => setCardsVisible(true), 40);
        }
        return () => {
            if (id) clearTimeout(id);
        };
    }, [loading]);
    return (
        <main className="flex-grow overflow-y-auto p-2 sm:p-3">
            {error && (
                <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/40">
                    {error}
                </div>
            )}
            {loading && !contentMounted ? (
                // show a centered spinner while loading
                <div className="flex h-full items-center justify-center">
                    <Spinner size={48} className="text-gray-600 dark:text-white" />
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9">
                    {reloading && (
                        <div className="absolute right-6 top-6 z-20">
                            <Spinner size={20} className="text-gray-600 dark:text-white" />
                        </div>
                    )}
                    {visiblePlaceItems.map((pi, idx) => (
                        <div
                            key={pi.key}
                            // animate each card in with a small stagger
                            className={`group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md dark:border-white/10 ${cardsVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.995]'}`}
                            style={{ transitionDelay: `${idx * 40}ms` }}
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
                                    priority={true}
                                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 16vw, 12vw"
                                    style={{ objectFit: 'cover' }}
                                    className="transition-transform duration-200 ease-in-out group-hover:scale-[1.03]"
                                />

                                {/* Overlay gradient for readability */}
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/100 via-black/70 to-transparent" />

                                {/* Footer content overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-1.5">
                                    <div className="flex items-end justify-between gap-0.5">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-0.5">
                                                {pi.color ? (
                                                    <span
                                                        className="inline-block h-2 w-2 rounded ring-1 ring-inset ring-white/30"
                                                        style={{ backgroundColor: pi.color || undefined }}
                                                        aria-label={t('color')}
                                                    />
                                                ) : null}
                                                <h3 className="truncate text-[10px] font-medium text-white drop-shadow">
                                                    {pi.name}
                                                </h3>
                                            </div>
                                            {/* Sizes preview - show on all screens but compact */}
                                            {pi.items.some((c) => c.size) && (
                                                <div className="mt-0.5 flex flex-wrap gap-0.5">
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
                                                        const shown = uniqueSizes.slice(0, 3);
                                                        return (
                                                            <>
                                                                {shown.map((sz) => (
                                                                    <span
                                                                        key={sz}
                                                                        className="rounded bg-white/15 px-1 py-0.5 text-[9px] text-white/90 ring-1 ring-inset ring-white/30 backdrop-blur-sm"
                                                                    >
                                                                        {sz}
                                                                    </span>
                                                                ))}
                                                                {uniqueSizes.length > 3 && (
                                                                    <span className="text-[9px] text-white/80">+{uniqueSizes.length - 3}</span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end text-white gap-0.5">
                                            <span className="text-[10px] font-bold leading-none">
                                                {currency} {pi.price.toFixed(2)}
                                            </span>
                                            {(() => {
                                                const anyWeight = pi.items.some((c) => c.measurementType === 'WEIGHT')
                                                const anyLength = pi.items.some((c) => c.measurementType === 'LENGTH')
                                                const anyVolume = pi.items.some((c) => c.measurementType === 'VOLUME')
                                                const anyArea = pi.items.some((c) => c.measurementType === 'AREA')
                                                const qty = pi.quantity
                                                const formatWeight = (g: number) => g >= 1000 ? `${(g / 1000).toFixed(1)}kg` : `${g}g`
                                                const formatLength = (cm: number) => cm >= 100 ? `${(cm / 100).toFixed(1)}m` : `${cm}cm`
                                                const formatVolume = (ml: number) => ml >= 1000 ? `${(ml / 1000).toFixed(1)}l` : `${ml}ml`
                                                const formatArea = (cm2: number) => cm2 >= 10000 ? `${(cm2 / 10000).toFixed(1)}m²` : `${cm2}cm²`
                                                const text = anyWeight ? formatWeight(qty) :
                                                             anyLength ? formatLength(qty) :
                                                             anyVolume ? formatVolume(qty) :
                                                             anyArea ? formatArea(qty) :
                                                             `${qty}`
                                                return (
                                                    <span className="rounded bg-black/50 px-1 py-0.5 text-[8px] leading-none ring-1 ring-white/20 backdrop-blur-sm">
                                                        {text}
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
            )}
        </main>
    )
}
