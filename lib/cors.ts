/**
 * CORS Configuration
 * Restrict API access to authorized origins
 *
 * SECURITY FIX: Properly isolate development and production origins
 * to prevent localhost bypass in production environments
 */

import { NextResponse } from 'next/server';

/**
 * Build allowed origins list based on environment
 * Production: Only explicitly configured domains
 * Development: Localhost variants + configured domain
 */
const ALLOWED_ORIGINS = (() => {
  const isProd = process.env.NODE_ENV === 'production';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (isProd) {
    // SECURITY: In production, ONLY allow explicitly configured domain
    // Never allow localhost origins in production
    if (!appUrl) {
      console.error(
        '[CORS] CRITICAL: NEXT_PUBLIC_APP_URL not set in production!',
      );
      return [];
    }
    return [appUrl];
  }

  // Development: Allow localhost variants + app URL
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ];

  // Add app URL if configured (avoid duplicates)
  if (appUrl && !devOrigins.includes(appUrl)) {
    devOrigins.push(appUrl);
  }

  return devOrigins;
})();

// Remove duplicates using Set
const UNIQUE_ALLOWED_ORIGINS = [...new Set(ALLOWED_ORIGINS)];

// Validate configuration on module load
if (UNIQUE_ALLOWED_ORIGINS.length === 0) {
  throw new Error(
    '[CORS] SECURITY ERROR: No allowed origins configured! Set NEXT_PUBLIC_APP_URL.',
  );
}

console.log(
  `[CORS] Allowed origins (${process.env.NODE_ENV}):`,
  UNIQUE_ALLOWED_ORIGINS,
);

export function corsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && UNIQUE_ALLOWED_ORIGINS.includes(origin);
  const isProd = process.env.NODE_ENV === 'production';

  // SECURITY: In production, if origin not allowed, return NO CORS headers
  // This causes the browser to block the request (CORS error)
  if (isProd && !isAllowed) {
    console.warn(`[CORS] Blocked unauthorized origin in production: ${origin}`);
    return {
      'Access-Control-Allow-Origin': '', // Empty = blocked by browser
    };
  }

  // Development: Be more lenient but still validate
  const allowedOrigin = isAllowed ? origin : UNIQUE_ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function handleCorsPreFlight(request: Request): NextResponse {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export function addCorsHeaders(
  response: NextResponse,
  request: Request,
): NextResponse {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
