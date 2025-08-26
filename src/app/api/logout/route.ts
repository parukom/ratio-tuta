import { NextResponse } from 'next/server';
import { clearSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function POST() {
  await clearSession();
  await logAudit({ action: 'auth.logout', status: 'SUCCESS' });
  return NextResponse.json({ ok: true }, { status: 200 });
}
