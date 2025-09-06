'use client'

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'

type Props = {
    children: React.ReactNode
    open: boolean
    onClose: () => void
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const Modal = ({ children, open, onClose, size = 'sm' }: Props) => {

    const sizeClass =
        size === '2xl' ? 'sm:max-w-5xl' :
            size === 'xl' ? 'sm:max-w-3xl' :
                size === 'lg' ? 'sm:max-w-lg' :
                    size === 'md' ? 'sm:max-w-md' :
                        'sm:max-w-sm'

    return (
        <Dialog open={open} onClose={onClose} className="relative z-[10000]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"
            />

            <div className="fixed inset-0 z-[10000] w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className={`relative transform rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full ${sizeClass} sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10`}
                    >
                        {/* Top-right close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-indigo-500"
                        >
                            {/* Inline X icon to avoid extra deps */}
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5" aria-hidden="true">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        {children}
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}
export default Modal