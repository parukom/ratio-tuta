/**
 * API Client with CSRF Protection
 *
 * Centralized API request handler that automatically includes CSRF tokens
 * for state-changing requests (POST, PATCH, PUT, DELETE).
 *
 * Usage:
 * ```tsx
 * import { apiRequest } from '@/lib/api-client';
 *
 * // Automatically includes CSRF token
 * const data = await apiRequest('/api/users/me', {
 *   method: 'PATCH',
 *   body: { name: 'New Name' },
 * });
 * ```
 */

'use client';

const STORAGE_KEY = 'csrf-token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get CSRF token from storage or fetch it
 */
async function getCsrfToken(): Promise<string> {
  // Try sessionStorage first
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) return cached;
  }

  // Fetch new token
  try {
    const res = await fetch('/api/csrf-token', {
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch CSRF token: ${res.status}`);
    }

    const data = await res.json();

    if (!data.token) {
      throw new Error('No token in response');
    }

    // Cache for future use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, data.token);
    }

    return data.token;
  } catch (error) {
    console.error('[API Client] Failed to get CSRF token:', error);
    throw new Error('Failed to get CSRF token');
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  // Skip CSRF token (use for public endpoints)
  skipCsrf?: boolean;
}

/**
 * Make an API request with automatic CSRF token handling
 *
 * @throws {ApiError} If the request fails
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipCsrf = false } = options;

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Detect if body is FormData
  const isFormData = body instanceof FormData;

  // Add Content-Type for JSON requests (but not FormData - browser sets it)
  if (body && !isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Add CSRF token for state-changing requests
  const requiresCsrf = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
  if (requiresCsrf && !skipCsrf) {
    try {
      const token = await getCsrfToken();
      requestHeaders['X-CSRF-Token'] = token;
    } catch (error) {
      throw new ApiError(
        'Failed to get CSRF token',
        500,
        { originalError: error },
      );
    }
  }

  // Make request
  try {
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      credentials: 'include', // Include session cookie
    });

    // Parse response
    let data: unknown;
    const contentType = res.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    // Handle errors
    if (!res.ok) {
      const errorMessage =
        typeof data === 'object' && data && 'error' in data
          ? String((data as { error: unknown }).error)
          : `Request failed: ${res.status}`;

      throw new ApiError(errorMessage, res.status, data);
    }

    return data as T;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      { originalError: error },
    );
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(url: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(url, { ...options, method: 'POST', body }),

  patch: <T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(url, { ...options, method: 'PATCH', body }),

  put: <T = unknown>(
    url: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>,
  ) => apiRequest<T>(url, { ...options, method: 'PUT', body }),

  delete: <T = unknown>(url: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
};

/**
 * Clear cached CSRF token (useful after logout)
 */
export function clearCsrfToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
