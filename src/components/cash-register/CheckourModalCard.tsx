"use client"
import { CreditCard, Trash2 } from "lucide-react"
import Spinner from '@/components/ui/Spinner';
import type { CartItem } from '@/types/cash-register';
import { useTranslations } from 'next-intl';

type Props = {
    setIsModalOpen: (value: React.SetStateAction<boolean>) => void
    cart: CartItem[]
    setCart: (value: React.SetStateAction<CartItem[]>) => void
    id: string | undefined
    cartTotal: number
    setAmountGiven: (value: React.SetStateAction<number>) => void
    setChange: (value: React.SetStateAction<number>) => void
    setShowChange: (value: React.SetStateAction<boolean>) => void
    completeSale: () => Promise<void>
    loading: boolean
}

const CheckoutModalCard: React.FC<Props> = ({
    setIsModalOpen,
    cart,
    setCart,
    cartTotal,
    setAmountGiven,
    setChange,
    setShowChange,
    completeSale,
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
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCart(prevCart => {
                                        return prevCart.filter(cartItem => cartItem.id !== item.id);
                                    });
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                title="Ištrinti prekę"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <span className="font-medium text-2xl text-gray-900 dark:text-white block truncate">{item.name}</span>
                                <span className="text-gray-500 text-sm dark:text-gray-400">
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
                        <div className="flex-shrink-0">
                            <span className="text-2xl font-medium text-gray-900 dark:text-white">€{(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="border-gray-200 mb-4">
                <div className="flex justify-between font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                    <span>{t('total')}:</span>
                    <span className="text-2xl">€{cartTotal.toFixed(2)}</span>
                </div>

                {/* buttons */}
                <div className="flex items-center justify-center space-x-2">

                    {/* kortele */}
                    <button
                        type="button"
                        onClick={() => {
                            completeSale();
                        }}
                        disabled={loading}
                        className="w-full rounded-lg px-6 py-6 text-sm font-medium shadow-sm transition-colors bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center"><Spinner size={24} className="text-white" aria-label={t('processing')} /></span>
                        ) : (
                            <span className="flex items-center justify-center"><CreditCard className="w-4 h-4 mr-2" /> {t('card')}</span>
                        )}
                    </button>

                    {/* atsaukti */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsModalOpen(false);
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

export default CheckoutModalCard
