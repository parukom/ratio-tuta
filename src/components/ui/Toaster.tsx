'use client'

import React from 'react'
import { Toaster } from 'react-hot-toast'

export default function AppToaster() {
    return (
        <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
                duration: 4000,
                className:
                    'text-sm rounded-md ring-1 bg-white text-gray-900 ring-gray-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10',
                success: {
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-green-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-green-600/30',
                    iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
                },
                error: {
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-red-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-red-600/30',
                    iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
                },
                loading: {
                    className:
                        'text-sm rounded-md ring-1 bg-white text-gray-900 ring-yellow-200/60 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:ring-yellow-600/30',
                },
            }}
        />
    )
}
