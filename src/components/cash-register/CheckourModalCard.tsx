"use client"
import { CreditCard } from "lucide-react"
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
        <>
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
                                    if (item.measurementType === 'WEIGHT') {
                                        const g = Number(item.quantity || 0);
                                        return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g} g`;
                                    }
                                    if (item.measurementType === 'LENGTH') {
                                        return `${item.quantity} m`;
                                    }
                                    return item.quantity;
                                })()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCart(prevCart => {
                                        const newCart = prevCart.map(cartItem =>
                                            cartItem.id === item.id
                                                ? { ...cartItem, quantity: Math.max(0, cartItem.quantity - 1) }
                                                : cartItem
                                        ).filter(cartItem => cartItem.quantity > 0);
                                        return newCart;
                                    });
                                }}
                                className="px-5 py-3 text-xl flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                -
                            </button>
                            <span className="text-2xl text-gray-900 dark:text-white">€{(item.subtotal ?? (item.price * item.quantity)).toFixed(2)}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCart(prevCart => {
                                        const newCart = prevCart.map(cartItem =>
                                            cartItem.id === item.id
                                                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                                : cartItem
                                        );
                                        // const cartRef = ref(db, `carts/${id}`);
                                        // set(cartRef, newCart);
                                        return newCart;
                                    });
                                }}
                                className="px-5 py-3 text-xl flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20"
                            >
                                +
                            </button>
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
                        onClick={() => {
                            completeSale();
                        }}
                        className="w-full rounded-lg px-6 py-6 text-sm font-medium shadow-sm transition-colors bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        <span className="flex items-center justify-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {loading ? <><span className='loader'></span>{t('processing')}</> : <span className="flex items-center justify-center"> {t('card')}</span>}
                        </span>
                    </button>

                    {/* atsaukti */}
                    <button
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
        </>
    )
}

export default CheckoutModalCard
