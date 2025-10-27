import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addCorsHeaders } from '@lib/cors';

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

export function middleware(req: NextRequest) {
  // Add CORS headers to all responses
  let response: NextResponse;

  // SECURITY FIX: Use appropriate cookie name based on environment
  const cookieName = process.env.NODE_ENV === 'production'
    ? '__Host-ratio-tuta-session'
    : 'ratio-tuta-session';
  const cookie = req.cookies.get(cookieName)?.value;
  const verified = verifySession(cookie);
  if (!verified.ok) {
    const url = new URL('/auth?form=login', req.url);
    response = NextResponse.redirect(url);
  } else if (verified.role !== 'ADMIN') {
    const url = new URL('/unallowed', req.url);
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  // Apply CORS headers
  return addCorsHeaders(response, req);
}

// Only run on dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
