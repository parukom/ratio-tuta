import { NextResponse } from 'next/server';
import { clearSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function POST() {
  // Use response-bound cookie deletion for reliability
  const res = NextResponse.json({ ok: true }, { status: 200 });
  try {
    res.cookies.delete('session');
  } catch {
    // Fallback to store-based deletion. Guard against any errors so the
    // route never throws and the client gets a stable response.
    try {
      await clearSession();
    } catch {
      console.warn('[logout] failed to clear session via store');
    }
  }
  try {
    await logAudit({ action: 'auth.logout', status: 'SUCCESS' });
  } catch {
    // logAudit is fire-and-forget internally but guard here as well
    console.warn('[logout] logAudit failed');
  }
  return res;
}
