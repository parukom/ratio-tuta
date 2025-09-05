"use client";
import React from 'react'

type Props = React.SVGProps<SVGSVGElement> & {
    size?: number
}

export default function Spinner({ size = 16, className = '', ...rest }: Props) {
    const dim = `${size}`
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`animate-spin ${className}`}
            width={dim}
            height={dim}
            {...rest}
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
    )
}
