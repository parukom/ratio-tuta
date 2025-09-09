import { FooterProps } from '@/types/cash-register';
import React from 'react'

export const CashRegisterFooter: React.FC<FooterProps> = ({
    totals,
    currency,
    cart,
    checkingOut,
    clearCart,
    setOpenChoosePayment,
    checkoutBtnRef
}) => {
    return (
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
    )
}
