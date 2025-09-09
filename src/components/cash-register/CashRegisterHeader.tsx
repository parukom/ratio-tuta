import React from 'react'
import Image from 'next/image';
import LogoutButton from '../LogoutButton';

export const CashRegisterHeader = () => {
    return (
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
            <div className="flex items-center gap-4">
                <Image src="/images/cat.jpg" alt="Logo" width={40} height={40} className="rounded w-10 h-10" priority />
                <h1 className="inline-block text-2xl font-bold text-gray-900 dark:text-white">Cash Register</h1>
            </div>
            <LogoutButton />
        </header>
    )
}
