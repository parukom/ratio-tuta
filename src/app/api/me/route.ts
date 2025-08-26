import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(session, { status: 200 });
}
