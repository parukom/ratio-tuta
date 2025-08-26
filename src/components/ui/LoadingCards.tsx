import React from 'react'

type Props = {
    count?: number
    className?: string
}

const LoadingCards: React.FC<Props> = ({ count = 6, className }) => {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ''}`}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm"
                >
                    {/* Shimmer overlay */}
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />

                    {/* Card skeleton content */}
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/5 rounded bg-gray-200 dark:bg-white/10" />
                            <div className="h-3 w-2/5 rounded bg-gray-200 dark:bg-white/10" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-2.5 w-full rounded bg-gray-200 dark:bg-white/10" />
                        <div className="h-2.5 w-5/6 rounded bg-gray-200 dark:bg-white/10" />
                        <div className="h-2.5 w-2/3 rounded bg-gray-200 dark:bg-white/10" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <div className="h-8 w-20 rounded-md bg-gray-200 dark:bg-white/10" />
                        <div className="h-8 w-16 rounded-md bg-gray-200 dark:bg-white/10" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default LoadingCards
