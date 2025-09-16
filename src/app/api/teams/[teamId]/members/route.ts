import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { canAddTeamMember } from '@/lib/limits';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';
import { hmacEmail, normalizeEmail, redactEmail } from '@lib/crypto';

// GET /api/teams/[teamId]/members -> list members of a team (requires requester in team)
export async function GET(
  _req: Request,
  context: RouteContext<'/api/teams/[teamId]/members'>,
) {
  const { teamId: teamIdParam } = await context.params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const teamId = teamIdParam;
  // Ensure requester belongs to this team (owner or member)
  const membership = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.teamMember.findMany({
    where: { teamId },
    select: {
      id: true,
      userId: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const members = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    role: r.role,
    name: r.user.name,
    email: r.user.email,
    createdAt: r.createdAt,
  }));
  return NextResponse.json(members);
}

export async function POST(
  _req: Request,
  context: RouteContext<'/api/teams/[teamId]/members'>,
) {
  const { teamId: teamIdParam } = await context.params;
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'team.member.add',
      status: 'DENIED',
      message: 'Unauthorized',
      teamId: teamIdParam,
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = teamIdParam;

  const { email, role } = (await _req.json()) as {
    email: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  };
  if (!email) {
    await logAudit({
      action: 'team.member.add',
      status: 'ERROR',
      message: 'Missing email',
      teamId,
    });
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

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
  if (!membership) {
    await logAudit({
      action: 'team.member.add',
      status: 'DENIED',
      message: 'Forbidden',
      actor: session,
      teamId,
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Find target user by email
  const normEmail = normalizeEmail(email);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { emailHmac: hmacEmail(normEmail) },
        { email: { equals: normEmail, mode: 'insensitive' } },
      ],
    },
  });
  if (!user) {
    await logAudit({
      action: 'team.member.add',
      status: 'ERROR',
      message: 'User not found',
      actor: session,
      teamId,
  metadata: { email: redactEmail(normEmail) },
    });
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Enforce member limit before adding
    try {
      const limit = await canAddTeamMember(teamId)
      if (!limit.allowed) {
        await logAudit({
          action: 'team.member.add',
          status: 'DENIED',
          actor: session,
          teamId,
          message: 'Member limit reached',
          metadata: { current: limit.current, max: limit.max }
        })
        return NextResponse.json({ error: 'Member limit reached. Upgrade your plan.' }, { status: 403 })
      }
    } catch {
      await logAudit({ action: 'team.member.limitCheck', status: 'ERROR', actor: session, teamId, message: 'Failed to check member limit' })
    }
    const tm = await prisma.teamMember.create({
      data: { teamId, userId: user.id, role: role ?? 'MEMBER' },
      select: { id: true, teamId: true, userId: true, role: true },
    });
    await logAudit({
      action: 'team.member.add',
      status: 'SUCCESS',
      actor: session,
      teamId,
      target: { table: 'TeamMember', id: tm.id },
  metadata: { email: redactEmail(normEmail), role: role ?? 'MEMBER' },
    });

    // If the invited user's email is not verified, send them a verification email
  if (!user.emailVerified) {
      try {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.emailVerificationToken.create({
          data: { userId: user.id, token, expiresAt },
        });
        await sendVerificationEmail({
          to: normEmail,
          name: user.name,
          token,
        });
      } catch {
        // Don't fail the invite if email send fails; just log it
        await logAudit({
          action: 'team.member.add.sendVerification',
          status: 'ERROR',
          actor: session,
          teamId,
          message: 'Failed to send verification email',
          metadata: { email: redactEmail(normEmail) },
        });
      }
    }
    return NextResponse.json(tm, { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in (e as Record<string, unknown>) &&
      (e as { code?: string }).code === 'P2002'
    ) {
      await logAudit({
        action: 'team.member.add',
        status: 'ERROR',
        message: 'Already in team',
        actor: session,
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
      action: 'team.member.add',
      status: 'ERROR',
      message: 'Server error',
      actor: session,
      teamId,
      metadata: { email },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
