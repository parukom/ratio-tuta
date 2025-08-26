import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, role } = (await req.json()) as {
    email: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
  if (!email)
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  // Find all teams the user belongs to (owned or member)
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
  const teamIds = Array.from(
    new Set<number>([
      ...owned.map((t) => t.id),
      ...memberOf.map((t) => t.teamId),
    ]),
  );

  if (teamIds.length === 0)
    return NextResponse.json(
      { error: 'No team found for current user' },
      { status: 400 },
    );
  if (teamIds.length > 1)
    return NextResponse.json(
      { error: 'Multiple teams found; provide teamId' },
      { status: 400 },
    );

  const teamId = teamIds[0];

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const tm = await prisma.teamMember.create({
      data: { teamId, userId: user.id, role: role ?? 'MEMBER' },
      select: { id: true, teamId: true, userId: true, role: true },
    });
    return NextResponse.json(tm, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002')
      return NextResponse.json(
        { error: 'User already in team' },
        { status: 409 },
      );
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
