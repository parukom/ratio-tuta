'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

/**
 * Auto-saves browser language preference if not already set.
 * The server already detects the locale from Accept-Language header,
 * but doesn't persist it. This component saves the detected locale
 * to a cookie so it persists across sessions.
 */
export default function AutoDetectLanguage() {
  const currentLocale = useLocale();

  useEffect(() => {
    // Check if locale cookie already exists
    const hasLocaleCookie = document.cookie
      .split('; ')
      .some(row => row.startsWith('locale='));

    // If cookie exists, user has already made a choice (or we've auto-saved before)
    if (hasLocaleCookie) return;

    // Save the current locale (already detected by server from Accept-Language)
    fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: currentLocale }),
    }).catch(err => {
      console.error('Failed to persist locale:', err);
    });
  }, [currentLocale]); // Run when locale changes

  return null; // This component doesn't render anything
}
