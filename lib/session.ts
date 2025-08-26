import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

// Signed cookie session with HMAC and expiry. For full-featured auth, consider next-auth or similar.

const SESSION_COOKIE = 'session';
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
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
  userId: number;
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
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  });
}

export async function getSession(): Promise<SessionData | null> {
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
    return token.data;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
