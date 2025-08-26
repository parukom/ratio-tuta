import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function GET() {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'auth.me',
      status: 'DENIED',
      message: 'No session',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await logAudit({ action: 'auth.me', status: 'SUCCESS', actor: session });
  return NextResponse.json(session, { status: 200 });
}
