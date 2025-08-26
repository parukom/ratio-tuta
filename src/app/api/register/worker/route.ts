import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { hashPassword } from '@lib/auth';
import { getSession } from '@lib/session';
import { randomBytes } from 'crypto';

// Protected endpoint: register someone else (e.g., worker)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, role, teamId } = (await req.json()) as {
      name: string;
      email: string;
      password?: string;
      role?: 'USER' | 'ADMIN';
      teamId?: number;
    };

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    // Work out team to attach to: if request includes teamId, validate membership; else if requester has one team, use it
    let targetTeamId: number | undefined = undefined;
    if (typeof teamId === 'number') {
      // ensure requester belongs to this team
      const ok = await prisma.team.findFirst({
        where: {
          id: teamId,
          OR: [
            { ownerId: session.userId },
            { members: { some: { userId: session.userId } } },
          ],
        },
        select: { id: true },
      });
      if (!ok)
        return NextResponse.json(
          { error: 'Forbidden teamId' },
          { status: 403 },
        );
      targetTeamId = teamId;
    } else {
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
      if (teamIds.length === 1) targetTeamId = teamIds[0];
      if (teamIds.length === 0)
        return NextResponse.json(
          { error: 'Requester is not in any team' },
          { status: 400 },
        );
      if (teamIds.length > 1)
        return NextResponse.json(
          { error: 'Multiple teams found; provide teamId' },
          { status: 400 },
        );
    }

  const finalPassword = password ?? randomBytes(12).toString('base64url');
  const userRole: 'USER' | 'ADMIN' = role ?? 'USER';
  const passwordHash = await hashPassword(finalPassword);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
    data: { name, email, password: passwordHash, role: userRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      // Attach to team (unique on userId will ensure single-team membership)
      await tx.teamMember.create({
        data: { teamId: targetTeamId!, userId: created.id, role: 'MEMBER' },
      });
      return created;
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
