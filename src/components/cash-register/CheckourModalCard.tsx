import { CreditCard, X } from "lucide-react"
import type { CartItem } from '@/types/cash-register';

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
    darkMode?: boolean
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
                    <X className="cursor-pointer"/>
                </button>
            </header>

            {/* body - items */}
            <div className="mb-4 max-h-64 overflow-y-auto">
                {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                            <span className={`font-medium text-2xl ${darkMode ? "text-white/90": ""}`}>{item.name}</span>
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
                                        // const cartRef = ref(db, `carts/${id}`);
                                        // set(cartRef, newCart);
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

                {/* buttons */}
                <div className="flex items-center justify-center space-x-2">
                  
                    {/* kortele */}
                    <button
                        onClick={() => {
                                completeSale();
                        }}
                        className={`w-full text-black transition-all duration-500 ${darkMode ? 'bg-zinc-400 hover:bg-zinc-500 hover:text-white/90' : 'border hover:bg-zinc-200 border-zinc-200'}  px-6 py-6 rounded-lg transition-colors`}
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

export default CheckoutModalCard
