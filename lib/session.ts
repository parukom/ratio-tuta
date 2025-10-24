import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@lib/prisma';
import { validateEnvironmentSecrets } from '@lib/crypto';

// Signed cookie session with HMAC and expiry. For full-featured auth, consider next-auth or similar.

/**
 * SECURITY FIX: Use __Host- prefix for session cookie in production
 * __Host- prefix enforces:
 * - secure: true (HTTPS only)
 * - path: / (entire domain)
 * - no domain attribute (prevents subdomain attacks)
 *
 * In development, use simple name since __Host- requires HTTPS
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#cookie_prefixes
 */
const SESSION_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Host-pecunia-session'
  : 'pecunia-session';
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

// SECURITY: Lazy validation of environment secrets
// Validates on first use to avoid build-time failures
// In production runtime, enforces strong secrets
let secretValidationDone = false;
function ensureSecretValidation() {
  // Skip if already validated or during build time
  if (secretValidationDone || typeof process.env.NEXT_RUNTIME === 'undefined') {
    return;
  }

  secretValidationDone = true;

  try {
    validateEnvironmentSecrets();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      // Production: Fail hard
      console.error(error);
      throw error;
    } else {
      // Development: Just warn (already logged by validateEnvironmentSecrets)
    }
  }
}

function getSecret(): string {
  ensureSecretValidation(); // Validate on first actual use

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set');
  }
  return secret;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64url(input: string): Buffer {
  const padLen = (4 - (input.length % 4 || 4)) % 4;
  const base64 =
    input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  return Buffer.from(base64, 'base64');
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

export type SessionData = {
  userId: string;
  name: string;
  role: 'USER' | 'ADMIN';
};

type Token = {
  data: SessionData;
  iat: number; // issued at (seconds)
  exp: number; // expiry (seconds)
};

export async function setSession(
  data: SessionData,
  maxAgeSec: number = DEFAULT_MAX_AGE_SEC,
) {
  const store = await cookies();
  const nowSec = Math.floor(Date.now() / 1000);
  const token: Token = { data, iat: nowSec, exp: nowSec + maxAgeSec };
  const payloadB64 = base64url(JSON.stringify(token));
  const sig = sign(payloadB64, getSecret());
  const value = `${payloadB64}.${sig}`;

  store.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'strict', // Strict CSRF protection - cookie only sent for same-site requests
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    path: '/', // Required by __Host- prefix
    // Note: domain attribute is intentionally omitted (required by __Host- prefix)
    maxAge: maxAgeSec,
  });
}

export async function getSession(
  opts?: { skipDbCheck?: boolean },
): Promise<SessionData | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const dot = value.lastIndexOf('.');
  if (dot < 0) return null;

  const payloadB64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(payloadB64, getSecret());

  try {
    const ok =
      expected.length === sig.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    if (!ok) return null;

    const token = JSON.parse(
      fromBase64url(payloadB64).toString('utf8'),
    ) as Token;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof token.exp !== 'number' || nowSec >= token.exp) return null;
    // Optional server-side invalidation via sessionRevokedAt
    if (!opts?.skipDbCheck) {
      try {
        // SECURITY FIX: Replace raw SQL with safe Prisma query
        const user = await prisma.user.findUnique({
          where: { id: token.data.userId },
          select: { sessionRevokedAt: true },
        });

        const revokedAt = user?.sessionRevokedAt ?? null;
        if (revokedAt) {
          const revokedSec = Math.floor(new Date(revokedAt).getTime() / 1000);
          // Invalidate tokens strictly older than the revoked timestamp
          if (token.iat < revokedSec) return null;
        }
      } catch {
        // On DB error, fail closed by denying session (safer)
        return null;
      }
    }
    return token.data;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  // Must match the same options as setSession for proper deletion
  store.delete(SESSION_COOKIE);
  // Also set an expired cookie to ensure deletion across all browsers
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0, // Expire immediately
  });
}
