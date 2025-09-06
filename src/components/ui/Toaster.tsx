'use client'

import React from 'react'
import { Toaster, ToastBar, toast, type ToastType } from 'react-hot-toast'
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid'

function TypeIcon({ type }: { type: ToastType }) {
    if (type === 'success') return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
    if (type === 'error') return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
    return (
        // default bullet for loading or blank types; loading shows spinner built-in next to message, so keep subtle dot
        <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 dark:bg-yellow-400" />
    )
}

export default function AppToaster() {
    return (
        <Toaster
            position="top-center"
            gutter={10}
            toastOptions={{
                // base theme
                duration: 4000,
                className:
                    'text-sm rounded-md ring-1 bg-white text-gray-900 ring-gray-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10',
                // per-type tweaks
                success: {
                    duration: 3000,
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-green-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-green-600/30',
                },
                error: {
                    duration: 5000,
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-red-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-red-600/30',
                },
                loading: {
                    duration: 10000,
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-yellow-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-yellow-600/30',
                },
            }}
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ message }) => (
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <TypeIcon type={t.type} />
                            </div>
                            <div className="min-w-0 break-words">{message}</div>
                            {t.type !== 'loading' && (
                                <button
                                    type="button"
                                    aria-label="Close"
                                    onClick={() => toast.dismiss(t.id)}
                                    className="ml-2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </ToastBar>
            )}
        </Toaster>
    )
}
