import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
// removed audit logging for GET to avoid noisy logs on navigation

export async function GET() {
  const session = await getSession();
  if (!session) {
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

  const map = new Map<string, { id: string; name: string }>();
  for (const t of owned) map.set(t.id, { id: t.id, name: t.name });
  for (const tm of memberOf)
    map.set(tm.team.id, { id: tm.team.id, name: tm.team.name });

  return NextResponse.json(
    Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)),
  );
}
