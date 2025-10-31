'use client'

import { ReactNode, useEffect, useState } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'
import { isLocale, type Locale, defaultLocale } from '@/i18n/config'

interface DashboardIntlProviderProps {
    children: ReactNode
}

export default function DashboardIntlProvider({ children }: DashboardIntlProviderProps) {
    const [locale, setLocale] = useState<Locale>(defaultLocale)
    const [messages, setMessages] = useState<AbstractIntlMessages>({})
    const [isLoading, setIsLoading] = useState(true)

    // Function to get locale from cookies
    const getLocaleFromCookies = (): Locale => {
        if (typeof document === 'undefined') return defaultLocale

        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
        }, {} as Record<string, string>)

        const cookieLocale = cookies.locale
        return isLocale(cookieLocale) ? cookieLocale : defaultLocale
    }

    // Load messages for the current locale
    const loadMessages = async (currentLocale: Locale) => {
        try {
            let newMessages
            switch (currentLocale) {
                case 'lt':
                    newMessages = (await import('@/messages/lt.json')).default
                    break
                case 'ru':
                    newMessages = (await import('@/messages/ru.json')).default
                    break
                case 'en':
                default:
                    newMessages = (await import('@/messages/en.json')).default
                    break
            }
            setMessages(newMessages)
        } catch (error) {
            console.error('Failed to load messages:', error)
            // Fallback to English messages
            try {
                const fallbackMessages = (await import('@/messages/en.json')).default
                setMessages(fallbackMessages)
            } catch (fallbackError) {
                console.error('Failed to load fallback messages:', fallbackError)
                setMessages({})
            }
        }
    }

    // Initial load
    useEffect(() => {
        const initialLocale = getLocaleFromCookies()
        setLocale(initialLocale)
        loadMessages(initialLocale).finally(() => setIsLoading(false))
    }, [])

    // Listen for cookie changes (when LanguageSwitcher updates locale)
    useEffect(() => {
        const checkForLocaleChanges = () => {
            const currentLocale = getLocaleFromCookies()
            if (currentLocale !== locale) {
                setLocale(currentLocale)
                setIsLoading(true)
                loadMessages(currentLocale).finally(() => setIsLoading(false))
            }
        }

        // Listen for custom locale change events (immediate response)
        const handleLocaleChange = (event: CustomEvent) => {
            const newLocale = event.detail?.locale
            if (isLocale(newLocale) && newLocale !== locale) {
                setLocale(newLocale)
                setIsLoading(true)
                loadMessages(newLocale).finally(() => setIsLoading(false))
            }
        }

        // Check for changes every 1000ms (fallback polling approach)
        const interval = setInterval(checkForLocaleChanges, 1000)

        // Listen for custom locale change events
        window.addEventListener('localeChanged', handleLocaleChange as EventListener)

        // Also listen for storage events (in case we use localStorage in future)
        const handleStorageChange = () => {
            checkForLocaleChanges()
        }

        window.addEventListener('storage', handleStorageChange)

        return () => {
            clearInterval(interval)
            window.removeEventListener('localeChanged', handleLocaleChange as EventListener)
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [locale])

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    )
}