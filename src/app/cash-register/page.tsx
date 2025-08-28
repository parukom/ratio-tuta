import React from 'react'
import Image from 'next/image'

// Static template for Cash Register page.
// No darkMode or business logic; simple Tailwind styling aligned with the rest of the app.
export default function CashRegisterPage() {
    const items = Array.from({ length: 8 }).map((_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        price: (5 + i).toFixed(2),
        duration: 15 + i * 5,
        color: ['#22c55e', '#3b82f6', '#ef4444', '#eab308'][i % 4],
    }))

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 shadow-xs sm:px-6 lg:px-8 dark:border-white/5 dark:bg-gray-900 dark:shadow-none">
                <div className="flex items-center gap-4">
                    <Image
                        src="/images/cat.jpg"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded"
                        priority
                    />
                    <h1 className="inline-block text-2xl font-bold text-gray-900 dark:text-white">Event Title</h1>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Cash Register</div>
            </header>

            {/* Content */}
            <main className="flex-grow overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((it) => (
                        <div
                            key={it.id}
                            className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-gray-800/50"
                        >
                            <div className="h-36 w-full bg-gray-100 dark:bg-white/5" />
                            <div className="p-4">
                                <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">{it.name}</h3>
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>€{it.price}</span>
                                    <span className="absolute right-2 top-2 inline-block h-7 w-7 rounded-full border-2 border-white" style={{ backgroundColor: it.color }} />
                                    <span>{it.duration} min</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="sticky bottom-0 border-t border-gray-200 bg-white px-4 dark:border-white/5 dark:bg-gray-900">
                <div className="mx-auto flex max-w-7xl items-center justify-between py-4">
                    <div className="flex items-center gap-6 text-xl text-gray-700 dark:text-gray-300">
                        <div>
                            <span className="font-semibold">Kiekis:</span> <span className="font-bold">0</span>
                        </div>
                        <div>
                            <span className="font-semibold">Suma:</span> <span className="font-bold">€0.00</span>
                        </div>
                    </div>
                    <button
                        disabled
                        className="mb-1 me-2 rounded-lg border border-gray-300 bg-gray-800 px-8 py-2.5 text-xl font-medium text-white opacity-60 dark:border-white/10 dark:bg-gray-700"
                    >
                        Tęsti
                    </button>
                </div>
            </footer>
        </div>
    )
}