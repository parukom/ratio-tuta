import React from 'react'

type Props = {
    rows?: number
    columnWidths?: string[]
    className?: string
}

const TableSkeleton: React.FC<Props> = ({ rows = 8, columnWidths = ['w-40', 'w-64', 'w-24', 'w-16'], className }) => {
    return (
        <tbody className={`divide-y  divide-gray-200 dark:divide-white/10 ${className ?? ''}`}>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx}>
                    {columnWidths.map((cw, cIdx) => (
                        <td
                            key={cIdx}
                            className={cIdx === 0 ? 'py-2 h-12 pr-2 pl-4 sm:pl-0' : 'py-2 h-11 px-1'}
                        >
                            <div className={`relative h-3 ${cw} rounded bg-gray-200 dark:bg-white/10 overflow-hidden`}>
                                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                            </div>
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

export default TableSkeleton
