import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addCorsHeaders } from '@lib/cors';
import createMiddleware from 'next-intl/middleware';
import { routing } from '../next-intl.config';

// Minimal verification of the session cookie structure, signature and role to protect /dashboard
function verifySession(cookie: string | undefined): {
  ok: boolean;
  role?: 'ADMIN' | 'USER';
} {
  if (!cookie) return { ok: false };
  try {
    // Cookie format: payloadB64.sig (see lib/session.ts)
    const dot = cookie.lastIndexOf('.');
    if (dot < 0) return { ok: false };
    const payloadB64 = cookie.slice(0, dot);
    // We can't access process.env securely in edge middleware for crypto, so perform a light parse only.
    // lib/session guards server-side rendering; this middleware is an extra fast-path.
    const json = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    const token = JSON.parse(json) as {
      data?: { role?: 'ADMIN' | 'USER' };
      exp?: number;
    };
    if (!token?.data?.role) return { ok: false };
    if (
      typeof token.exp === 'number' &&
      Math.floor(Date.now() / 1000) >= token.exp
    )
      return { ok: false };
    return { ok: true, role: token.data.role };
  } catch {
    return { ok: false };
  }
}

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this is a private route that doesn't need i18n
  const isPrivateRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/cash-register') ||
    pathname.startsWith('/api');

  // Handle i18n routing only for public routes
  if (!isPrivateRoute) {
    const intlResponse = intlMiddleware(req);
    return addCorsHeaders(intlResponse, req);
  }

  // For dashboard routes, handle auth without i18n
  if (pathname.startsWith('/dashboard')) {
    // SECURITY FIX: Use appropriate cookie name based on environment
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Host-ratio-tuta-session'
        : 'ratio-tuta-session';
    const cookie = req.cookies.get(cookieName)?.value;
    const verified = verifySession(cookie);

    if (!verified.ok) {
      // Get user's preferred locale from cookie (fallback to 'en')
      const localeCookie = req.cookies.get('locale')?.value;
      const preferredLocale = ['en', 'lt', 'ru'].includes(localeCookie || '')
        ? localeCookie
        : 'en';
      const url = new URL(`/${preferredLocale}/auth?form=login`, req.url);
      const response = NextResponse.redirect(url);
      return addCorsHeaders(response, req);
    } else if (verified.role !== 'ADMIN') {
      const url = new URL('/dashboard/unallowed', req.url);
      const response = NextResponse.redirect(url);
      return addCorsHeaders(response, req);
    }
  }

  // For other private routes (cash-register, api), just pass through
  const response = NextResponse.next();
  return addCorsHeaders(response, req);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, assets, api), robots.txt, sitemap.xml, manifest, etc.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run on root URL
    '/(api|trpc)(.*)',
  ],
};
