"use client";
import React, { useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CheckoutModalCash from '@/components/cash-register/CheckoutModalCash';
import CheckoutModalCard from '@/components/cash-register/CheckourModalCard';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Modal from '@/components/modals/Modal';
import SelectVariantModal, { VariantGroup } from './SelectVariantModal';
import flyToCart from '@/lib/flyToCart';
import { CashRegisterFooter } from './CashRegisterFooter';
import { CashRegisterMainSection } from './CashRegisterMainSection';
import { CashRegisterHeader } from './CashRegisterHeader';
import { ChoosePaymentModal } from './ChoosePaymentModal';
import { SortKey, useCart, useGroupedSearch, usePlaceItems, usePlaces } from './useCashRegister';



export default function CashRegisterClient() {
    const searchParams = useSearchParams();
    const queryPlaceId = searchParams.get('placeId');
    const { places, activePlaceId, setActivePlaceId, currency, error: placesError } = usePlaces(queryPlaceId);
    const { placeItems, reload: reloadItems, reloadQuiet, error: itemsError, loading: loadingItems } = usePlaceItems(activePlaceId);
    const placesLoading = places === null;
    const isReady = !placesLoading && (!activePlaceId || !loadingItems);
    const { cart, addVariantToCart, clearCart, totals, cartArray, setCartFromModal } = useCart();
    const [checkingOut, setCheckingOut] = useState(false);
    const [openChoosePayment, setOpenChoosePayment] = useState(false);
    const [openCashModal, setOpenCashModal] = useState(false);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [paymentOption, setPaymentOption] = useState<'CASH' | 'CARD'>('CASH');
    const [amountGiven, setAmountGiven] = useState(0);
    const [change, setChange] = useState(0);
    const [showChange, setShowChange] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openVariant, setOpenVariant] = useState(false);
    const [activeGroup, setActiveGroup] = useState<VariantGroup | null>(null);
    const [reloading, setReloading] = useState(false);
    const checkoutBtnRef = useRef<HTMLButtonElement | null>(null);
    const { search, setSearch, visiblePlaceItems, inStockOnly, setInStockOnly, sortKey, setSortKey } = useGroupedSearch(placeItems);

    // Helper to reset payment related transient state when modals close without completing sale
    const resetPaymentState = useCallback(() => {
        setAmountGiven(0);
        setChange(0);
        setShowChange(false);
        setPaymentOption('CASH');
    }, []);

    async function completeSale() {
        if (!activePlaceId || cart.size === 0) return;
        setCheckingOut(true);
        setError(null);
        try {
            // Backend expects integer quantities:
            // - WEIGHT: quantity is grams (cart holds grams)
            // - LENGTH: round meters to nearest integer meter for now (until backend supports cm)
            const items = Array.from(cart.values()).map((l) => ({
                itemId: l.itemId,
                quantity: Math.round(l.quantity),
            }));
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
            // perform a quiet reload so we don't show the full skeleton UI
            if (typeof reloadQuiet === 'function') {
                try {
                    setReloading(true);
                    await reloadQuiet();
                } finally {
                    setReloading(false);
                }
            } else {
                await reloadItems();
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Checkout failed';
            setError(msg);
        } finally {
            setCheckingOut(false);
        }
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            <LoadingOverlay isReady={isReady} minDuration={2000} />
            {/* Header */}
            <CashRegisterHeader
                search={search}
                setSearch={setSearch}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                sortKey={sortKey as SortKey}
                setSortKey={setSortKey as (v: React.SetStateAction<SortKey>) => void}
                places={places}
                activePlaceId={activePlaceId}
                setActivePlaceId={setActivePlaceId}
            />

            {/* Content */}
            <CashRegisterMainSection
                error={error || placesError || itemsError}
                visiblePlaceItems={visiblePlaceItems}
                currency={currency}
                setActiveGroup={setActiveGroup}
                setOpenVariant={setOpenVariant}
                loading={loadingItems}
                reloading={reloading}
            />
            {/* Footer */}
            <CashRegisterFooter
                totals={totals}
                currency={currency}
                cart={cart}
                checkingOut={checkingOut}
                clearCart={clearCart}
                setOpenChoosePayment={setOpenChoosePayment}
                checkoutBtnRef={checkoutBtnRef}
            />

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
                <ChoosePaymentModal
                    setPaymentOption={setPaymentOption}
                    setOpenChoosePayment={setOpenChoosePayment}
                    setOpenCashModal={setOpenCashModal}
                    setOpenCardModal={setOpenCardModal}
                />
            </Modal>

            {/* Cash Modal */}
            <Modal
                open={openCashModal}
                onClose={() => {
                    setOpenCashModal(false);
                    resetPaymentState();
                }}
                size="lg"
            >
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
            <Modal
                open={openCardModal}
                onClose={() => {
                    setOpenCardModal(false);
                    resetPaymentState();
                }}
                size="lg"
            >
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
