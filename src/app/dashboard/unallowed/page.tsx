'use client'
import Link from 'next/link'
import React from 'react'
import { useEffect, useState } from 'react'

const Unallowed = () => {
    const [locale, setLocale] = useState('en')

    useEffect(() => {
        // Get locale from cookie
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
        }, {} as Record<string, string>)

        const cookieLocale = cookies.locale
        if (['en', 'lt', 'ru'].includes(cookieLocale)) {
            setLocale(cookieLocale)
        }
    }, [])

    return (
        <main className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white/5 border border-white/6 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center space-y-6 transform transition-all duration-200 hover:scale-[1.01]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 15a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="currentColor" />
                        <path d="M17 8h-1V6a4 4 0 10-8 0v2H7a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2zm-8-2a2 2 0 114 0v2h-4V6z" fill="currentColor" />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold text-white">Access Denied</h1>

                <p className="text-sm text-slate-300">
                    You don’t have permission to view this page. If you think this is a mistake, request access or contact support.
                </p>

                <div className="flex gap-3 justify-center">
                    <Link
                        href={`/${locale}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-md text-sm"
                        aria-label="Go back home"
                    >
                        Back to Home
                    </Link>

                    <a
                        href="mailto:support@example.com"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-white/6 text-white hover:bg-white/5 rounded-md text-sm"
                        aria-label="Contact support"
                    >
                        Contact Support
                    </a>
                </div>

                <p className="text-xs text-slate-500">
                    Reference ID: <span className="font-mono text-slate-400">#{Math.random().toString(36).slice(2, 9)}</span>
                </p>
            </div>
        </main>
    )
}
export default Unallowed