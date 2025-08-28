import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const limitParam = searchParams.get('limit');
  const limit = Math.max(1, Math.min(Number(limitParam) || 50, 200));

  // Teams current user belongs to (owner or member)
  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: session.userId },
      select: { teamId: true },
    }),
  ]);
  const myTeamIds = Array.from(
    new Set<string>([
      ...owned.map((t) => t.id),
      ...memberOf.map((t) => t.teamId),
    ]),
  );

  if (myTeamIds.length === 0) return NextResponse.json([]);

  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    const tid = teamIdParam;
    if (!myTeamIds.includes(tid))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [tid];
  }

  // Users who are in these teams (members + owners)
  const [members, owners] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: { in: filterTeamIds } },
      select: { userId: true },
    }),
    prisma.team.findMany({
      where: { id: { in: filterTeamIds } },
      select: { ownerId: true },
    }),
  ]);
  const teamUserIds = Array.from(
    new Set<string>([
      ...members.map((m) => m.userId),
      ...owners.map((o) => o.ownerId),
    ]),
  );

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { teamId: { in: filterTeamIds } },
        { actorUserId: { in: teamUserIds } },
      ],
    },
    include: {
      actorUser: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return NextResponse.json(logs);
}
