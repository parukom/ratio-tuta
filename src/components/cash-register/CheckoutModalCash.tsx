import { Banknote } from "lucide-react"
import Spinner from '@/components/ui/Spinner';
import React from 'react';
import type { CartItem } from '@/types/cash-register';
import { useTranslations } from 'next-intl';

type Props = {
    setIsModalOpen: (value: React.SetStateAction<boolean>) => void
    cart: CartItem[]
    setCart: (value: React.SetStateAction<CartItem[]>) => void
    id: string | undefined
    cartTotal: number
    amountGiven: number
    setAmountGiven: (value: React.SetStateAction<number>) => void
    setChange: (value: React.SetStateAction<number>) => void
    setShowChange: (value: React.SetStateAction<boolean>) => void
    showChange: boolean
    completeSale: () => Promise<void>
    change: number
    loading: boolean
}

const CheckoutModalCash: React.FC<Props> = ({
    setIsModalOpen,
    cart,
    setCart,
    cartTotal,
    amountGiven,
    setAmountGiven,
    setChange,
    setShowChange,
    showChange,
    completeSale,
    change,
    loading
}) => {
    const t = useTranslations('CashRegister');
    const tc = useTranslations('Common');

    return (
        <main className="min-w-[330px]">
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('cart')}</h2>

            </header>

            {/* body - items */}
            <div className="mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <span className="font-medium text-2xl text-gray-900 dark:text-white">{item.name}</span>
                            <span className="text-gray-500 text-sm ml-2 dark:text-gray-400">
                                x{(() => {
                                    const qty = Number(item.quantity || 0);
                                    if (item.measurementType === 'WEIGHT') {
                                        return qty >= 1000 ? `${(qty / 1000).toFixed(2)} kg` : `${qty} g`;
                                    }
                                    if (item.measurementType === 'LENGTH') {
                                        return qty >= 100 ? `${(qty / 100).toFixed(2)} m` : `${qty} cm`;
                                    }
                                    if (item.measurementType === 'VOLUME') {
                                        return qty >= 1000 ? `${(qty / 1000).toFixed(2)} l` : `${qty} ml`;
                                    }
                                    if (item.measurementType === 'AREA') {
                                        return qty >= 10000 ? `${(qty / 10000).toFixed(2)} m²` : `${qty} cm²`;
                                    }
                                    return item.quantity;
                                })()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="border-gray-200 mb-4">
                <div className="flex justify-between font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                    <span>{t('total')}:</span>
                    <span className="text-2xl">€{cartTotal.toFixed(2)}</span>
                </div>

                {/* amount given */}
                <div className="mb-4">
                    <label htmlFor="amount-given" className="block text-gray-700 dark:text-gray-300 mb-2">
                        {t('amountGiven')}
                    </label>
                    <input
                        type="number"
                        id="amount-given"
                        value={amountGiven}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setAmountGiven(value);
                            const amount = value;
                            if (!isNaN(amount) && amount >= cartTotal) {
                                setChange(amount - cartTotal);
                                setShowChange(true);
                            } else {
                                setShowChange(false);
                            }
                        }}
                        className="text-2xl w-full px-3 py-2 rounded-md outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 bg-white text-gray-900 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* change due */}
                {showChange && (
                    <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-white/5">
                        <p className="font-medium text-xl text-gray-900 dark:text-white">
                            {t('change')}: <span>€{change.toFixed(2)}</span>
                        </p>
                    </div>
                )}

                {/* money buttons 5, 10, 20, 50, 100 */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                    {[1, 2, 5, 10, 20, 50, 100].map((value) => {
                        return (
                            <button
                                key={value}
                                onClick={() => {
                                    const currentAmount = amountGiven || 0;
                                    const newAmount = currentAmount + value;
                                    setAmountGiven(newAmount);
                                    const newChange = newAmount - cartTotal;
                                    setChange(newChange);
                                    setShowChange(newChange >= 0);
                                }}
                                className="px-2 py-4 rounded-md text-lg font-semibold shadow-sm cursor-pointer transition-colors bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                            >
                                €{value}
                            </button>
                        );
                    })}
                </div>

                {/* buttons */}
                <div className="flex items-center justify-center space-x-2">

                    {/* cash */}
                    <button
                        type="button"
                        onClick={completeSale}
                        disabled={(!showChange) || loading}
                        className="w-full cursor-pointer rounded-lg px-5 py-6 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center"><Spinner size={24} className="text-white" aria-label={t('processing')} /></span>
                        ) : (
                            <span className="flex items-center justify-center"><Banknote className="w-5 h-5 mr-2" /> {t('cash')}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsModalOpen(false);
                            setCart([]);
                            setAmountGiven(0);
                            setChange(0);
                            setShowChange(false);
                        }}
                        className="w-full cursor-pointer rounded-md border px-4 py-6 transition-colors text-gray-800 border-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        {tc('cancel')}
                    </button>
                </div>
            </footer>
        </main>
    )
}

export default CheckoutModalCash
