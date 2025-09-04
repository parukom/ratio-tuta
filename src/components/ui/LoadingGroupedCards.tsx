import React from 'react'
import LoadingCards from './LoadingCards'

type Props = {
    groupCount?: number
    cardsPerGroup?: number
    className?: string
}

// Skeleton matching the "Group by box" layout: group headers + card grids
const LoadingGroupedCards: React.FC<Props> = ({ groupCount = 3, cardsPerGroup = 4, className }) => {
    return (
        <div className={`space-y-4 ${className ?? ''}`}>
            {Array.from({ length: groupCount }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 dark:border-white/10">
                    {/* Group header skeleton */}
                    <div className="w-full px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                {/* Chevron placeholder */}
                                <div className="h-4 w-4 rounded bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                </div>
                                {/* Color swatch */}
                                <div className="h-6 w-6 rounded-md ring-1 ring-inset ring-gray-200 dark:ring-white/10 bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                </div>
                                {/* Title and chips */}
                                <div className="min-w-0 space-y-1">
                                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="h-4 w-20 rounded-full bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                        </div>
                                        <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                        </div>
                                        <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Right side small details + button placeholder */}
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block space-y-1">
                                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                    </div>
                                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10 relative overflow-hidden">
                                        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                    </div>
                                </div>
                                <div className="h-7 w-24 rounded-md border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5 relative overflow-hidden">
                                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Group body skeleton cards */}
                    <div className="px-3 pb-3">
                        <LoadingCards count={cardsPerGroup} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default LoadingGroupedCards
