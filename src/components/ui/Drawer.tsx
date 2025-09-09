'use client'

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import React from 'react'

type Props = {
    open: boolean
    onClose: () => void
    side?: 'right' | 'left'
    title?: string
    children: React.ReactNode
    widthClassName?: string // allow callers to adjust width if needed
}

export default function Drawer({ open, onClose, side = 'right', title, children, widthClassName }: Props) {
    const containerSide = side === 'right' ? 'right-0 pl-10 sm:pl-16' : 'left-0 pr-10 sm:pr-16'
    const closedTransform = side === 'right' ? 'data-closed:translate-x-full' : 'data-closed:-translate-x-full'
    const width = widthClassName ?? 'w-screen max-w-md'

    return (
        <Dialog open={open} onClose={onClose} className="relative z-[10000]">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0 dark:bg-gray-900/50"
            />

            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`pointer-events-none fixed inset-y-0 ${containerSide.includes('right-0') ? 'right-0' : 'left-0'} flex max-w-full ${containerSide}`}>
                        <DialogPanel
                            transition
                            className={`pointer-events-auto ${width} transform transition duration-500 ease-in-out ${closedTransform}`}
                        >
                            <div className="relative flex h-full flex-col overflow-y-auto bg-white shadow-xl dark:bg-gray-900 dark:after:absolute dark:after:inset-y-0 dark:after:left-0 dark:after:w-px dark:after:bg-white/10">
                                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close"
                                        className="relative rounded-md text-gray-400 hover:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:text-white dark:focus-visible:outline-indigo-500"
                                    >
                                        <span className="absolute -inset-2.5" />
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6" aria-hidden="true">
                                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}
