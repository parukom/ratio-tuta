import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const actor = session;

  const { email, role } = (await req.json()) as {
    email: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
  if (!email) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'Missing email',
    });
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  // Find all teams the user belongs to (owned or member)
  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: actor.userId },
      select: { id: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: actor.userId },
      select: { teamId: true },
    }),
  ]);
  const teamIds = Array.from(
    new Set<string>([
      ...owned.map((t) => t.id),
      ...memberOf.map((t) => t.teamId),
    ]),
  );

  if (teamIds.length === 0) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'No team for requester',
      actor,
    });
    return NextResponse.json(
      { error: 'No team found for current user' },
      { status: 400 },
    );
  }
  if (teamIds.length > 1) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'Multiple teams',
      actor,
      metadata: { teamIds },
    });
    return NextResponse.json(
      { error: 'Multiple teams found; provide teamId' },
      { status: 400 },
    );
  }

  const teamId = teamIds[0];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'User not found',
      actor,
      metadata: { email },
    });
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const tm = await prisma.teamMember.create({
      data: { teamId, userId: user.id, role: role ?? 'MEMBER' },
      select: { id: true, teamId: true, userId: true, role: true },
    });
    await logAudit({
      action: 'team.member.add.auto',
      status: 'SUCCESS',
      actor,
      teamId,
      target: { table: 'TeamMember', id: tm.id },
      metadata: { email, role: role ?? 'MEMBER' },
    });
    return NextResponse.json(tm, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      await logAudit({
        action: 'team.member.add.auto',
        status: 'ERROR',
        message: 'Already in team',
        actor,
        teamId,
        metadata: { email },
      });
      return NextResponse.json(
        { error: 'User already in team' },
        { status: 409 },
      );
    }
    console.error(e);
    await logAudit({
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'Server error',
      actor,
      teamId,
      metadata: { email },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
