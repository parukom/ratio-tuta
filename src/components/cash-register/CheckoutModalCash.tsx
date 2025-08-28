import { Banknote, X } from "lucide-react"
import type { CartItem } from '@/types/cash-register';

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
    darkMode?: boolean
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
    loading,
    darkMode
}) => {

    return (
        <>
            <header className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white/90' : 'text-gray-800'}`}>Krepšelis</h2>
                <button
                    onClick={() => {
                        setIsModalOpen(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <X className="cursor-pointer" />
                </button>
            </header>

            {/* body - items */}
            <div className="mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                            <span className={`font-medium text-2xl ${darkMode ? "text-white/90" : ""}`}>{item.name}</span>
                            <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
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
                                className="px-5 py-3 text-xl flex items-center justify-center bg-gray-200 rounded-2xl hover:bg-gray-300"
                            >
                                -
                            </button>
                            <span className={`text-2xl ${darkMode ? 'text-white/90' : ''}`}>€{(item.price * item.quantity).toFixed(2)}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCart(prevCart => {
                                        const newCart = prevCart.map(cartItem =>
                                            cartItem.id === item.id
                                                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                                : cartItem
                                        );
                                        return newCart;
                                    });
                                }}
                                className="px-5 py-3 text-xl flex items-center justify-center bg-gray-200 rounded-2xl hover:bg-gray-300"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="border-gray-200 mb-4">
                <div className={`flex justify-between font-semibold text-lg mb-4 ${darkMode ? 'text-white/80' : ''}`}>
                    <span>Viso:</span>
                    <span className="text-2xl">€{cartTotal.toFixed(2)}</span>
                </div>

                {/* amount given */}
                <div className="mb-4">
                    <label htmlFor="amount-given" className={`block ${darkMode ? 'text-white/80' : 'text-gray-700'} mb-2`}>
                        Gauta pinigų (€)
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
                        className={`text-2xl w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-zinc-300' : ''} ${!darkMode ? 'bg-gray-100' : ''}`}
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* change due */}
                {showChange && (
                    <div className="mb-4 p-3 bg-gray-100 rounded-md">
                        <p className="font-medium text-xl">
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
                                    const currentAmount = amountGiven || 0;
                                    const newAmount = currentAmount + value;
                                    setAmountGiven(newAmount);
                                    const newChange = newAmount - cartTotal;
                                    setChange(newChange);
                                    setShowChange(newChange >= 0);
                                }}
                                className={`px-4 cursor-pointer ${darkMode ? 'bg-emerald-600 text-white/90 hover:bg-emerald-800' : 'bg-zinc-700 text-white hover:bg-zinc-800'} transition-all duration-500 py-5 rounded-md text-lg font-semibold shadow-md hover:shadow-lg`}
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
                        disabled={(!showChange) || loading}
                        className={`transition-all duration-500 cursor-pointer py-6 px-5 text-sm font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-4  w-full ${darkMode ? 'focus:ring-gray-700 bg-emerald-600 text-gray-100 border-gray-600 hover:text-white hover:bg-emerald-900' : 'focus:ring-gray-700 bg-gray-800 text-gray-100 border-gray-600 hover:text-white hover:bg-gray-700'} ${(!showChange) || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <><span className='loader'></span>Saugoma</> : <span className="flex items-center justify-center"><Banknote className="w-5 h-5 mr-2" /> Grynais</span>}
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
                        className={`w-full cursor-pointer ${darkMode ? 'hover:bg-zinc-900 text-gray-200 border border-zinc-500' : 'hover:bg-zinc-200 text-gray-800'} px-4 py-6 rounded-md transition-all duration-500`}
                    >
                        Atšaukti
                    </button>
                </div>
            </footer>
        </>
    )
}

export default CheckoutModalCash
