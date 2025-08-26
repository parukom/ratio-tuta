import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function GET() {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'team.list',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session.userId },
      select: { id: true, name: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: session.userId },
      select: { team: { select: { id: true, name: true } } },
    }),
  ]);

  const map = new Map<number, { id: number; name: string }>();
  for (const t of owned) map.set(t.id, t);
  for (const tm of memberOf) map.set(tm.team.id, tm.team);

  await logAudit({ action: 'team.list', status: 'SUCCESS', actor: session });
  return NextResponse.json(
    Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)),
  );
}
