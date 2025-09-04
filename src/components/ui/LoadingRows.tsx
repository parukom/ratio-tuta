import React from 'react'

type Props = {
    rows?: number
    // Provide widths for each column to match the table header
    columnWidths?: string[]
    className?: string
}

const LoadingRows: React.FC<Props> = ({ rows = 8, columnWidths = ["w-56", "w-36", "w-24", "w-24", "w-16", "w-20", "w-20", "w-40"], className }) => {
    return (
        <tbody className={`divide-y divide-gray-200 dark:divide-white/10 ${className ?? ''}`}>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx} className={`${rIdx === 0 ? 'h-[50px]' : 'h-[61px]'}`}>
                    {columnWidths.map((cw, cIdx) => (
                        <td key={cIdx} className={cIdx === 0 ? 'py-2.5 pr-2 pl-4 sm:pl-0' : 'py-2.5 px-1'}>
                            <div className={`relative ${cw} h-4 rounded bg-gray-200 dark:bg-white/10 overflow-hidden`}>
                                <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent dark:via-white/10 animate-[shimmer_1.6s_infinite]" />
                            </div>
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    )
}

export default LoadingRows
