/**
 * CSRF Token Hook
 *
 * Fetches and manages CSRF token for API requests.
 * The token is automatically refreshed on mount and stored in sessionStorage.
 *
 * Usage:
 * ```tsx
 * const { token, loading, error, refresh } = useCsrfToken();
 *
 * // Use in API calls
 * fetch('/api/users/me', {
 *   method: 'PATCH',
 *   headers: {
 *     'X-CSRF-Token': token,
 *   },
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'csrf-token';

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(() => {
    // Try to load from sessionStorage on mount
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState(!token); // Skip loading if token already cached
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/csrf-token', {
        credentials: 'include', // Include session cookie
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch CSRF token: ${res.status}`);
      }

      const data = await res.json();

      if (!data.token) {
        throw new Error('No token in response');
      }

      setToken(data.token);

      // Cache in sessionStorage for reuse
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, data.token);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[CSRF] Failed to fetch token:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch token if not already cached
    if (!token) {
      fetchToken();
    }
  }, [token, fetchToken]);

  return {
    token,
    loading,
    error,
    refresh: fetchToken, // Allow manual refresh
  };
}
