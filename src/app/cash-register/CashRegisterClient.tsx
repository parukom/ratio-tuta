"use client";
import React from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

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
    const [places, setPlaces] = React.useState<Place[] | null>(null);
    const [activePlaceId, setActivePlaceId] = React.useState<string | null>(null);
    const [placeItems, setPlaceItems] = React.useState<PlaceItem[] | null>(null);
    const [cart, setCart] = React.useState<Map<string, CartLine>>(new Map());
    const [, setLoading] = React.useState(false);
    const [checkingOut, setCheckingOut] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const activePlace = React.useMemo(() => places?.find((p) => p.id === activePlaceId) || null, [places, activePlaceId]);
    const currency = activePlace?.currency || 'EUR';

    React.useEffect(() => {
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

    React.useEffect(() => {
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

    const totals = React.useMemo(() => {
        let qty = 0;
        let sum = 0;
        for (const line of cart.values()) {
            qty += line.quantity;
            sum += line.price * line.quantity;
        }
        return { qty, sum };
    }, [cart]);

    async function checkout() {
        if (!activePlaceId || cart.size === 0) return;
        setCheckingOut(true);
        setError(null);
        try {
            const items = Array.from(cart.values()).map((l) => ({ itemId: l.itemId, quantity: l.quantity }));
            const res = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ placeId: activePlaceId, items, amountGiven: totals.sum, paymentOption: 'CASH' }),
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
            clearCart();
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
                    <Image src="/images/cat.jpg" alt="Logo" width={40} height={40} className="rounded" priority />
                    <h1 className="inline-block text-2xl font-bold text-gray-900 dark:text-white">Cash Register</h1>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="place" className="text-sm text-gray-600 dark:text-gray-400">
                        Place
                    </label>
                    <select
                        id="place"
                        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-gray-800 dark:text-white"
                        value={activePlaceId ?? ''}
                        onChange={(e) => setActivePlaceId(e.target.value || null)}
                    >
                        {(places || []).map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
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
                            onClick={checkout}
                            disabled={cart.size === 0 || checkingOut}
                            className="mb-1 me-2 rounded-lg border border-gray-300 bg-gray-800 px-8 py-2.5 text-xl font-medium text-white disabled:opacity-50 dark:border-white/10 dark:bg-gray-700"
                        >
                            {checkingOut ? 'Processing…' : 'Tęsti'}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
