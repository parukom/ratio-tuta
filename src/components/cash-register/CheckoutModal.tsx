
import { Banknote, CreditCard } from "lucide-react"
import type { CartItem } from '@/types/cash-register';

type Props = {
    setIsModalOpen: (value: React.SetStateAction<boolean>) => void
    cart: CartItem[]
    setCart: (value: React.SetStateAction<CartItem[]>) => void
    id: string | undefined
    cartTotal: number
    amountGiven: number
    paymentOption: string
    setAmountGiven: (value: React.SetStateAction<number>) => void
    setChange: (value: React.SetStateAction<number>) => void
    setShowChange: (value: React.SetStateAction<boolean>) => void
    showChange: boolean
    completeSale: () => Promise<void>
    change: number
    loading: boolean
    setPaymentOption: (value: React.SetStateAction<string>) => void
    cartCount: number
}

const CheckoutModal: React.FC<Props> = ({
    setIsModalOpen,
    cart,
    setCart,
    cartTotal,
    amountGiven,
    paymentOption,
    setAmountGiven,
    setChange,
    setShowChange,
    showChange,
    completeSale,
    change,
    loading,
    setPaymentOption,
    cartCount
}) => {

    return (
        <>
            <header className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Krepšelis</h2>

            </header>

            {/* body - items */}
            <div className="mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <span className="font-medium text-2xl text-gray-900 dark:text-white">{item.name}</span>
                            <span className="text-gray-500 text-sm ml-2 dark:text-gray-400">x{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCart(prevCart => {
                                        const newCart = prevCart.map(cartItem => {
                                            if (cartItem.id !== item.id) return cartItem;
                                            const step = 1; // simple modal; parent flow handles units
                                            const nextQty = Math.max(0, Number((cartItem.quantity - step).toFixed(2)));
                                            return { ...cartItem, quantity: nextQty };
                                        }).filter(cartItem => cartItem.quantity > 0);
                                        // const cartRef = ref(db, `carts/${id}`);
                                        // set(cartRef, newCart);
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
                                        const newCart = prevCart.map(cartItem => {
                                            if (cartItem.id !== item.id) return cartItem;
                                            const step = 1;
                                            const nextQty = Number((cartItem.quantity + step).toFixed(2));
                                            return { ...cartItem, quantity: nextQty };
                                        });
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
                    <span>Viso:</span>
                    <span className="text-2xl">€{cartTotal.toFixed(2)}</span>
                </div>

                {/* amount given */}
                <div className="mb-4">
                    <label htmlFor="amount-given" className="block text-gray-700 dark:text-gray-300 mb-2">
                        Gauta pinigų (€)
                    </label>
                    <input
                        type="number"
                        id="amount-given"
                        value={amountGiven}
                        disabled={paymentOption === 'CARD'}
                        onChange={(e) => {
                            if (paymentOption === 'CARD') return;
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
                        className={`text-2xl w-full px-3 py-2 rounded-md outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 bg-white text-gray-900 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 ${paymentOption === 'CARD' ? 'opacity-60' : ''}`}
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* change due */}
                {showChange && (
                    <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-white/5">
                        <p className="font-medium text-xl text-gray-900 dark:text-white">
                            Grąža: <span>€{change.toFixed(2)}</span>
                        </p>
                    </div>
                )}

                {/* money buttons 5, 10, 20, 50, 100 */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {[1, 2, 5, 10, 20, 50, 100].map((value) => {
                        return (
                            <button
                                key={value}
                                onClick={() => {
                                    if (paymentOption === 'CASH') {
                                        const currentAmount = amountGiven || 0;
                                        const newAmount = currentAmount + value;
                                        setAmountGiven(newAmount);
                                        const newChange = newAmount - cartTotal;
                                        setChange(newChange);
                                        setShowChange(newChange >= 0);
                                    }
                                }}
                                disabled={paymentOption === 'CARD'}
                                className="px-4 py-5 rounded-md text-lg font-semibold shadow-sm cursor-pointer transition-colors bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                            >
                                €{value}
                            </button>
                        );
                    })}
                </div>



                {/* buttons */}
                <div className="flex items-center justify-center space-x-2">

                    {/* grynais */}
                    <button
                        onClick={completeSale}
                        disabled={(paymentOption === 'CASH' && !showChange) || loading}
                        className="w-full cursor-pointer rounded-lg px-5 py-6 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        {loading ? <><span className='loader'></span>Saugoma</> : <span className="flex items-center justify-center"><Banknote className="w-5 h-5 mr-2" /> Grynais</span>}
                    </button>

                    {/* kortele */}
                    <button
                        onClick={() => {
                            setPaymentOption('CARD');
                            if (paymentOption === "CARD") {
                                completeSale();
                            }
                        }}
                        disabled={cartCount === 0}
                        className={`w-full rounded-lg px-6 py-6 text-sm font-medium shadow-sm transition-colors bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 ${cartCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span className="flex items-center justify-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            {loading ? <><span className='loader'></span>Saugoma</> : <span className="flex items-center justify-center"> Kortele</span>}
                        </span>
                    </button>

                    {/* atsaukti */}
                    <button
                        onClick={() => {
                            setIsModalOpen(false);
                            setPaymentOption('CASH');
                            setCart([]);
                            setAmountGiven(0);
                            setChange(0);
                            setShowChange(false);
                            // const cartRef = ref(db, `carts/${id}`);
                            // set(cartRef, null);
                        }}
                        className="w-full cursor-pointer rounded-md border px-4 py-6 transition-colors text-gray-800 border-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Atšaukti
                    </button>
                </div>
            </footer>
        </>
    )
}

export default CheckoutModal
