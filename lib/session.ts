import { cookies } from 'next/headers';

// Minimal, unsigned cookie session for demo purposes.
// For production, integrate a robust solution (e.g., next-auth, Lucia, or signed/encrypted cookies).

const SESSION_COOKIE = 'session';

export type SessionData = {
  userId: number;
  name: string;
  role: 'USER' | 'ADMIN';
};

export async function setSession(data: SessionData) {
  const store = await cookies();
  const value = Buffer.from(JSON.stringify(data)).toString('base64');
  store.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    return JSON.parse(
      Buffer.from(value, 'base64').toString('utf8'),
    ) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
