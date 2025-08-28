import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
// removed audit logging for GET to avoid noisy logs on navigation

export async function GET(req: Request) {
  // Identify current user from session
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const includeSelf = searchParams.get('includeSelf') === 'true';

  // Collect team ids where the user is a member or owner
  const [memberTeams, ownedTeams] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: session.userId },
      select: { teamId: true },
    }),
    prisma.team.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    }),
  ]);

  const myTeamIds = new Set<string>([
    ...memberTeams.map((t) => t.teamId),
    ...ownedTeams.map((t) => t.id),
  ]);

  // If a specific teamId is requested, ensure the user belongs to it
  let targetTeamIds: string[] = Array.from(myTeamIds);
  if (teamIdParam) {
    const tid = teamIdParam;
    if (!myTeamIds.has(tid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    targetTeamIds = [tid];
  }

  if (targetTeamIds.length === 0) {
    return NextResponse.json([]);
  }

  // Find unique users who either are members of these teams or own them
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { teams: { some: { teamId: { in: targetTeamIds } } } },
        { ownedTeams: { some: { id: { in: targetTeamIds } } } },
      ],
      ...(includeSelf ? {} : { id: { not: session.userId } }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const data = await req.json();
  const user = await prisma.user.create({ data });
  return NextResponse.json(user);
}
