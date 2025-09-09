import React from 'react'

type ChoosePaymentProps = {
    setPaymentOption: (value: React.SetStateAction<"CASH" | "CARD">) => void
    setOpenChoosePayment: (value: React.SetStateAction<boolean>) => void;
    setOpenCashModal: (value: React.SetStateAction<boolean>) => void
    setOpenCardModal: (value: React.SetStateAction<boolean>) => void
}

export const ChoosePaymentModal: React.FC<ChoosePaymentProps> = ({ setPaymentOption, setOpenChoosePayment, setOpenCashModal, setOpenCardModal }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pasirinkite mokėjimo būdą</h3>
            <div className='mt-4 flex justify-between gap-4'>
                <button
                    className="flex flex-col items-center justify-center h-48 w-full rounded-lg p-6 transition-colors border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10"
                    onClick={() => {
                        setPaymentOption('CASH');
                        setOpenChoosePayment(false);
                        setOpenCashModal(true);
                    }}
                >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                        <path d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M19 16H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M19 8H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">GRYNAIS</span>
                </button>

                <button
                    className="flex flex-col items-center justify-center h-48 w-full rounded-lg p-6 transition-colors border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10"
                    onClick={() => {
                        setPaymentOption('CARD');
                        setOpenChoosePayment(false);
                        setOpenCardModal(true);
                    }}
                >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white">
                        <path d="M22 10H2V8C2 6.34315 3.34315 5 5 5H19C20.6569 5 22 6.34315 22 8V10Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M22 10V16C22 17.6569 20.6569 19 19 19H5C3.34315 19 2 17.6569 2 16V10" stroke="currentColor" strokeWidth="2" />
                        <path d="M6 15H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">KORTELE</span>
                </button>
            </div>
        </div>
    )
}
