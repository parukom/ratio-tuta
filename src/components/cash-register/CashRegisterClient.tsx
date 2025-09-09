"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
// Payment modals
import CheckoutModalCash from '@/components/cash-register/CheckoutModalCash';
import CheckoutModalCard from '@/components/cash-register/CheckourModalCard';
import Modal from '@/components/modals/Modal';
import SearchInput from '@/components/ui/SearchInput';
import type { CartItem } from '@/types/cash-register';
import SelectVariantModal, { VariantChild, VariantGroup } from './SelectVariantModal';
import flyToCart from '@/lib/flyToCart';

type Place = {
    id: string;
    teamId: string;
    name: string;
    currency: string | null;
};

type PlaceItem = {
    id: string; // placeItem id
    placeId: string;
    itemId: string;
    quantity: number;
    item: {
        id: string;
        name: string;
        price: number;
        sku: string | null;
        image?: string | null;
        color?: string | null;
        size?: string | null;
        unit?: string | null;
        measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
    };
};

type CartLine = { itemId: string; title: string; price: number; quantity: number };
type GroupedPlaceItem = {
    key: string; // group key by name+color
    name: string;
    color: string | null;
    image?: string | null;
    price: number;
    quantity: number; // total stock across variants in the group
    items: Array<{ placeItemId: string; itemId: string; quantity: number; price: number; sku: string | null; image?: string | null; size?: string | null; unit?: string | null; measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME' }>;
};

export default function CashRegisterClient() {
    const searchParams = useSearchParams();
    const queryPlaceId = searchParams.get('placeId');
    const [places, setPlaces] = useState<Place[] | null>(null);
    const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
    const [placeItems, setPlaceItems] = useState<PlaceItem[] | null>(null);
    const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
    const [, setLoading] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [openChoosePayment, setOpenChoosePayment] = useState(false);
    const [openCashModal, setOpenCashModal] = useState(false);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [paymentOption, setPaymentOption] = useState<'CASH' | 'CARD'>('CASH');
    const [amountGiven, setAmountGiven] = useState(0);
    const [change, setChange] = useState(0);
    const [showChange, setShowChange] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openVariant, setOpenVariant] = useState(false);
    const [activeGroup, setActiveGroup] = useState<VariantGroup | null>(null);
    const checkoutBtnRef = useRef<HTMLButtonElement | null>(null);

    const activePlace = useMemo(() => places?.find((p) => p.id === activePlaceId) || null, [places, activePlaceId]);
    const currency = activePlace?.currency || 'EUR';

    useEffect(() => {
        let cancelled = false;
        async function loadPlaces() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/places');
                if (!res.ok) throw new Error('Failed to load places');
                const data: unknown = await res.json();
                if (!Array.isArray(data)) throw new Error('Invalid response');
                if (cancelled) return;
                const shaped: Place[] = data
                    .filter((p: unknown): p is { id: string; teamId: string; name: string; currency: string | null } => {
                        if (!p || typeof p !== 'object') return false;
                        const obj = p as Record<string, unknown>;
                        return (
                            typeof obj.id === 'string' &&
                            typeof obj.teamId === 'string' &&
                            typeof obj.name === 'string' &&
                            (obj.currency === null || typeof obj.currency === 'string')
                        );
                    })
                    .map((p) => ({ id: p.id, teamId: p.teamId, name: p.name, currency: p.currency }));
                setPlaces(shaped);
                if (shaped.length > 0) {
                    const preferred = queryPlaceId && shaped.some((p) => p.id === queryPlaceId) ? queryPlaceId : shaped[0].id;
                    setActivePlaceId((id) => id ?? preferred);
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error';
                if (!cancelled) setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadPlaces();
        return () => {
            cancelled = true;
        };
    }, [queryPlaceId]);

    useEffect(() => {
        if (!activePlaceId) return;
        let cancelled = false;
        async function loadItems() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/places/${activePlaceId}/items`);
                if (!res.ok) throw new Error('Failed to load items');
                const data: PlaceItem[] = await res.json();
                if (!cancelled) setPlaceItems(data);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Error';
                if (!cancelled) setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadItems();
        return () => {
            cancelled = true;
        };
    }, [activePlaceId]);

    // Modal confirm: add selected variant with requested quantity (capped by stock)
    function addVariantToCart(child: VariantChild, requestedQty: number, displayName: string, displayPrice: number) {
        setCart((prev) => {
            const next = new Map(prev);
            const current = next.get(child.itemId);
            const have = current?.quantity || 0;
            const room = Math.max(0, child.quantity - have);
            const add = Math.min(Math.max(1, requestedQty), room);
            if (add <= 0) return prev;
            next.set(child.itemId, {
                itemId: child.itemId,
                title: displayName,
                price: displayPrice,
                quantity: have + add,
            });
            return next;
        });
    }

    function clearCart() {
        setCart(new Map());
    }

    const totals = useMemo(() => {
        let qty = 0;
        let sum = 0;
        for (const line of cart.values()) {
            qty += line.quantity;
            sum += line.price * line.quantity;
        }
        return { qty, sum };
    }, [cart]);

    // Group duplicate place items by itemId and sum quantities
    const groupedItems = useMemo((): GroupedPlaceItem[] => {
        const map = new Map<string, GroupedPlaceItem>();
        for (const pi of placeItems || []) {
            const fullName = (pi.item.name ?? '').trim();
            const base = (fullName.split(' - ')[0] || fullName).trim();
            const color = (pi.item.color ?? '').trim() || null;
            const key = `${base.toLowerCase()}|${(color ?? '').toLowerCase()}`;
            const child = {
                placeItemId: pi.id,
                itemId: pi.itemId,
                quantity: pi.quantity,
                price: pi.item.price,
                sku: pi.item.sku,
                image: pi.item.image ?? null,
                size: pi.item.size ?? null,
                unit: pi.item.unit ?? null,
                measurementType: pi.item.measurementType ?? 'PCS',
            };
            const existing = map.get(key);
            if (!existing) {
                map.set(key, {
                    key,
                    name: base,
                    color,
                    image: pi.item.image ?? null,
                    price: pi.item.price,
                    quantity: pi.quantity,
                    items: [child],
                });
            } else {
                existing.quantity += pi.quantity;
                existing.items.push(child);
                // keep the first price as display price
            }
        }
        // Stable sort by name for predictability
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [placeItems]);

    // Filter grouped items by search query (name or SKU)
    const visiblePlaceItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return groupedItems;
        return groupedItems.filter((gi) => {
            const name = gi.name.toLowerCase();
            // Combine SKUs across children for search convenience
            const skus = gi.items.map((c) => c.sku?.toLowerCase() ?? '').join(' ');
            const color = (gi.color ?? '').toLowerCase();
            return tokens.every((t) => name.includes(t) || skus.includes(t) || color.includes(t));
        });
    }, [groupedItems, search]);

    // Adapt cart Map to modal's array-based API
    const cartArray: CartItem[] = useMemo(() => {
        return Array.from(cart.values()).map((l) => ({ id: l.itemId, name: l.title, price: l.price, quantity: l.quantity }));
    }, [cart]);

    function setCartFromModal(updater: React.SetStateAction<CartItem[]>) {
        setCart((prev) => {
            const prevArr: CartItem[] = Array.from(prev.values()).map((l) => ({ id: l.itemId, name: l.title, price: l.price, quantity: l.quantity }));
            const nextArr = typeof updater === 'function' ? (updater as (p: CartItem[]) => CartItem[])(prevArr) : updater;
            const next = new Map<string, CartLine>();
            for (const item of nextArr) {
                if (item.quantity > 0) {
                    next.set(item.id, { itemId: item.id, title: item.name, price: item.price, quantity: item.quantity });
                }
            }
            return next;
        });
    }

    async function completeSale() {
        if (!activePlaceId || cart.size === 0) return;
        setCheckingOut(true);
        setError(null);
        try {
            const items = Array.from(cart.values()).map((l) => ({ itemId: l.itemId, quantity: l.quantity }));
            const payload = {
                placeId: activePlaceId,
                items,
                amountGiven: paymentOption === 'CARD' ? totals.sum : amountGiven,
                paymentOption,
            };
            const res = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let errMsg = 'Checkout failed';
                try {
                    const data: unknown = await res.json();
                    if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
                        const v = (data as Record<string, unknown>).error;
                        if (typeof v === 'string') errMsg = v;
                    }
                } catch {
                    // ignore
                }
                throw new Error(errMsg);
            }
            // success
            clearCart();
            setOpenCashModal(false);
            setOpenCardModal(false);
            setOpenChoosePayment(false);
            setAmountGiven(0);
            setChange(0);
            setShowChange(false);
            setPaymentOption('CASH');
            const itemsRes = await fetch(`/api/places/${activePlaceId}/items`);
            if (itemsRes.ok) setPlaceItems(await itemsRes.json());
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Checkout failed';
            setError(msg);
        } finally {
            setCheckingOut(false);
        }
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
                <div className="flex items-center gap-4">
                    <Image src="/images/cat.jpg" alt="Logo" width={40} height={40} className="rounded w-10 h-10" priority />
                    <h1 className="inline-block text-2xl font-bold text-gray-900 dark:text-white">Cash Register</h1>
                </div>
                <LogoutButton />
            </header>

            {/* Content */}
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
                                    src={pi.image ?? '/images/cat.jpg'}
                                    alt={pi.name}
                                    fill
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

            {/* Footer */}
            <footer className="sticky bottom-0 border-t border-gray-200 bg-white px-4 dark:border-white/5 dark:bg-gray-900">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-6 text-xl text-gray-700 dark:text-gray-300">
                        <div>
                            <span className="font-semibold">Kiekis:</span> <span className="font-bold">{totals.qty}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Suma:</span>{' '}
                            <span className="font-bold">
                                {currency} {totals.sum.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearCart}
                            disabled={cart.size === 0 || checkingOut}
                            className="rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 dark:border-white/10 dark:text-gray-200"
                        >
                            Clear
                        </button>
                        <button
                            ref={checkoutBtnRef}
                            onClick={() => {
                                setOpenChoosePayment(true);
                            }}
                            disabled={cart.size === 0 || checkingOut}
                            className="mb-1 me-2 rounded-lg border border-gray-300 bg-gray-800 px-8 py-2.5 text-xl font-medium text-white disabled:opacity-50 dark:border-white/10 dark:bg-gray-700"
                        >
                            {checkingOut ? 'Processing…' : 'Tęsti'}
                        </button>
                    </div>
                </div>
            </footer>
            {/* Variant selection modal */}
            <SelectVariantModal
                open={openVariant}
                onClose={() => setOpenVariant(false)}
                group={activeGroup}
                currency={currency}
                onConfirm={({ child, quantity }) => {
                    const displayName = activeGroup?.name ?? child.sku ?? 'Item';
                    const displayPrice = child.price;
                    addVariantToCart(child, quantity, displayName, displayPrice);
                    // Animate from the selected variant button to the checkout button
                    try {
                        const modal = document.querySelector('[role="dialog"]');
                        const selectedEl = modal?.querySelector('[data-variant-selected="true"]') as HTMLElement | null;
                        const target = checkoutBtnRef.current;
                        if (selectedEl && target) flyToCart(selectedEl, target);
                    } catch { /* noop */ }
                    setOpenVariant(false);
                }}
            />
            {/* Choose Payment Modal */}
            <Modal open={openChoosePayment} onClose={() => setOpenChoosePayment(false)} size="md">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pasirinkite mokėjimo būdą</h3>
                    <div className='mt-4 flex justify-between gap-4'>
                        <button
                            className="flex flex-col items-center justify-center h-48 w-full rounded-lg p-6 transition-colors border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10"
                            onClick={() => {
                                setPaymentOption('CASH');
                                setOpenChoosePayment(false);
                                setOpenCashModal(true);
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                                <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M19 16H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M19 8H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">GRYNAIS</span>
                        </button>

                        <button
                            className="flex flex-col items-center justify-center h-48 w-full rounded-lg p-6 transition-colors border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10"
                            onClick={() => {
                                setPaymentOption('CARD');
                                setOpenChoosePayment(false);
                                setOpenCardModal(true);
                            }}
                        >
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                                <path d="M22 10H2V8C2 6.34315 3.34315 5 5 5H19C20.6569 5 22 6.34315 22 8V10Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M22 10V16C22 17.6569 20.6569 19 19 19H5C3.34315 19 2 17.6569 2 16V10" stroke="currentColor" strokeWidth="2" />
                                <path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">KORTELE</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Cash Modal */}
            <Modal open={openCashModal} onClose={() => setOpenCashModal(false)} size="lg">
                <CheckoutModalCash
                    setIsModalOpen={setOpenCashModal}
                    cart={cartArray}
                    setCart={setCartFromModal}
                    id={activePlaceId ?? undefined}
                    cartTotal={totals.sum}
                    amountGiven={amountGiven}
                    setAmountGiven={setAmountGiven}
                    setChange={setChange}
                    setShowChange={setShowChange}
                    showChange={showChange}
                    completeSale={async () => {
                        setPaymentOption('CASH');
                        await completeSale();
                    }}
                    change={change}
                    loading={checkingOut}
                />
            </Modal>

            {/* Card Modal */}
            <Modal open={openCardModal} onClose={() => setOpenCardModal(false)} size="lg">
                <CheckoutModalCard
                    setIsModalOpen={setOpenCardModal}
                    cart={cartArray}
                    setCart={setCartFromModal}
                    id={activePlaceId ?? undefined}
                    cartTotal={totals.sum}
                    setAmountGiven={setAmountGiven}
                    setChange={setChange}
                    setShowChange={setShowChange}
                    completeSale={async () => {
                        setPaymentOption('CARD');
                        await completeSale();
                    }}
                    loading={checkingOut}
                />
            </Modal>
        </div>
    );
}
