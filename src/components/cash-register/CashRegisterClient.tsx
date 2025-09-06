"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
// Payment modals
import CheckoutModalCash from '@/components/cash-register/CheckoutModalCash';
import CheckoutModalCard from '@/components/cash-register/CheckourModalCard';
import Modal from '@/components/modals/Modal';
import type { CartItem } from '@/types/cash-register';

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
    };
};

type CartLine = { itemId: string; title: string; price: number; quantity: number };

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
    // const [isAdmin, setIsAdmin] = useState(false);

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

    // // Load current user to determine admin role
    // useEffect(() => {
    //     let cancelled = false;
    //     (async () => {
    //         try {
    //             const res = await fetch('/api/me');
    //             if (!res.ok) throw new Error('unauthorized');
    //             const data: unknown = await res.json();
    //             if (!cancelled && data && typeof data === 'object' && 'role' in (data as Record<string, unknown>)) {
    //                 const role = (data as Record<string, unknown>).role;
    //                 setIsAdmin(role === 'ADMIN');
    //             }
    //         } catch {
    //             if (!cancelled) setIsAdmin(false);
    //         }
    //     })();
    //     return () => {
    //         cancelled = true;
    //     };
    // }, []);

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

    function addToCart(pi: PlaceItem) {
        setCart((prev) => {
            const next = new Map(prev);
            const current = next.get(pi.itemId);
            const maxQty = pi.quantity;
            const nextQty = Math.min((current?.quantity || 0) + 1, maxQty);
            next.set(pi.itemId, {
                itemId: pi.itemId,
                title: pi.item.name,
                price: pi.item.price,
                quantity: nextQty,
            });
            return next;
        });
    }

    function decrement(pi: PlaceItem) {
        setCart((prev) => {
            const next = new Map(prev);
            const current = next.get(pi.itemId);
            if (!current) return prev;
            const q = Math.max(current.quantity - 1, 0);
            if (q === 0) next.delete(pi.itemId);
            else next.set(pi.itemId, { ...current, quantity: q });
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {(placeItems || []).map((pi) => (
                        <div
                            key={pi.id}
                            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-gray-800/50"
                        >
                            <div className="h-36 w-full bg-gray-100 dark:bg-white/5" />
                            <div className="p-4">
                                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">{pi.item.name}</h3>
                                <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>
                                        {currency} {pi.item.price.toFixed(2)}
                                    </span>
                                    <span>Stock: {pi.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => decrement(pi)} className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-white/10">
                                        -
                                    </button>
                                    <span className="min-w-8 text-center">{cart.get(pi.itemId)?.quantity || 0}</span>
                                    <button
                                        onClick={() => addToCart(pi)}
                                        disabled={(cart.get(pi.itemId)?.quantity || 0) >= pi.quantity}
                                        className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-white/10"
                                    >
                                        +
                                    </button>
                                </div>
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
