import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export async function POST(
  _req: Request,
  context: RouteContext<'/api/teams/[teamId]/members'>,
) {
  const { teamId: teamIdParam } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teamId = Number(teamIdParam);
  if (!Number.isInteger(teamId))
    return NextResponse.json({ error: 'Invalid teamId' }, { status: 400 });

  const { email, role } = (await _req.json()) as {
    email: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
  if (!email)
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  // Ensure requester belongs to this team (owner or member)
  const membership = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true, ownerId: true },
  });
  if (!membership)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find target user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const tm = await prisma.teamMember.create({
      data: { teamId, userId: user.id, role: role ?? 'MEMBER' },
      select: { id: true, teamId: true, userId: true, role: true },
    });
    return NextResponse.json(tm, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'User already in team' },
        { status: 409 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
