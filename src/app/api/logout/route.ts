import { NextResponse } from 'next/server';
import { clearSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function POST() {
  // Use response-bound cookie deletion for reliability
  const res = NextResponse.json({ ok: true }, { status: 200 });
  try {
    res.cookies.delete('session');
  } catch {
    // Fallback to store-based deletion
    await clearSession();
  }
  await logAudit({ action: 'auth.logout', status: 'SUCCESS' });
  return res;
}
