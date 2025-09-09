import React from 'react'

type Props = {
    count?: number
    className?: string
}

// Skeleton grid matching CashRegisterMainSection item cards (image tile with overlay)
const LoadingItemTiles: React.FC<Props> = ({ count = 9, className }) => {
    const gridClasses =
        className?.trim() ||
        'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 lg:grid-cols-6 xl:grid-cols-7'
    return (
        <div className={gridClasses}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-white/10"
                >
                    <div className="relative aspect-square sm:aspect-[3/4] w-full bg-gray-100 dark:bg-white/5">
                        {/* Base shimmer surface */}
                        <div className="absolute inset-0 bg-gray-200/70 dark:bg-white/10" />
                        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />

                        {/* Overlay gradient for readability like real cards */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/100 via-black/70 to-transparent" />

                        {/* Footer content overlay skeleton */}
                        <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2">
                            <div className="flex items-end justify-between gap-1">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="hidden sm:inline-block h-3 w-3 rounded ring-1 ring-inset ring-white/30 bg-white/30" />
                                        <div className="h-[10px] w-24 rounded bg-white/40" />
                                    </div>
                                    <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                                        <span className="h-[14px] w-10 rounded bg-white/25 ring-1 ring-inset ring-white/30 backdrop-blur-sm" />
                                        <span className="h-[14px] w-8 rounded bg-white/25 ring-1 ring-inset ring-white/30 backdrop-blur-sm" />
                                        <span className="h-[14px] w-12 rounded bg-white/25 ring-1 ring-inset ring-white/30 backdrop-blur-sm" />
                                        <span className="h-[14px] w-6 rounded bg-white/25 ring-1 ring-inset ring-white/30 backdrop-blur-sm" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <div className="h-[10px] w-14 rounded bg-white/60" />
                                    <div className="h-[10px] w-16 rounded bg-white/30" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default LoadingItemTiles
