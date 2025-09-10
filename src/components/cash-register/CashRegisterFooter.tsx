"use client"
import { FooterProps } from '@/types/cash-register';
import React from 'react'
import { useTranslations } from 'next-intl';
import { ShoppingCart, Trash2, ArrowRight, EuroIcon } from 'lucide-react';

export const CashRegisterFooter: React.FC<FooterProps> = ({
    totals,
    currency,
    cart,
    checkingOut,
    clearCart,
    setOpenChoosePayment,
    checkoutBtnRef
}) => {
    const t = useTranslations('CashRegister');
    return (
        <footer className="sticky bottom-0 safe-bottom border-t border-gray-200 bg-white px-4 dark:border-white/5 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl py-4 pb-8 sm:pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Totals */}
                    <div className="flex w-full items-center justify-between gap-4 text-base text-gray-700 sm:w-auto sm:justify-start sm:gap-6 sm:text-xl dark:text-gray-300">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" aria-hidden />
                            <span className="hidden sm:inline font-semibold">{t('qtyLabel')}:</span>
                            <span className="font-bold">{totals.qty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <EuroIcon className="h-5 w-5" aria-hidden />
                            <span className="hidden sm:inline font-semibold">{t('sumLabel')}:</span>
                            <span className="font-bold">
                                {currency} {totals.sum.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <button
                            onClick={clearCart}
                            disabled={cart.size === 0 || checkingOut}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5 sm:flex-none sm:px-4"
                        >
                            <Trash2 className="h-5 w-5" aria-hidden />
                            <span>{t('clear')}</span>
                        </button>
                        <button
                            ref={checkoutBtnRef}
                            onClick={() => {
                                setOpenChoosePayment(true);
                            }}
                            disabled={cart.size === 0 || checkingOut}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-800 px-4 py-2.5 text-lg font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:border-white/10 dark:bg-gray-700 dark:hover:bg-gray-600 sm:flex-none sm:px-6"
                        >
                            {checkingOut ? (
                                <span>{t('processing')}</span>
                            ) : (
                                <>
                                    <span>{t('continue')}</span>
                                    <ArrowRight className="h-5 w-5" aria-hidden />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    )
}
