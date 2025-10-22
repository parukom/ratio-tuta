import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { canAddTeamMember } from '@/lib/limits';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';
import { hmacEmail, normalizeEmail, redactEmail } from '@lib/crypto';
import {
  getUserTeamRole,
  validateRoleAssignment,
  type TeamRole
} from '@lib/authorization';

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

  // SECURITY FIX: Check requester's role before allowing member addition
  const membership = await getUserTeamRole(actor.userId, teamId);
  if (!membership) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'DENIED',
      message: 'Requester not in team',
      actor,
      teamId,
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only OWNER or ADMIN can add members
  if (membership.role === 'MEMBER') {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'DENIED',
      message: 'Insufficient permissions. Admin or Owner role required.',
      actor,
      teamId,
    });
    return NextResponse.json(
      { error: 'Admin or Owner role required to add team members' },
      { status: 403 }
    );
  }

  // Validate role assignment
  const targetRole = (role ?? 'MEMBER') as TeamRole;
  try {
    validateRoleAssignment(membership.role, membership.isOwner, targetRole);
  } catch (error) {
    await logAudit({
      action: 'team.member.add.auto',
      status: 'DENIED',
      message: error instanceof Error ? error.message : 'Role validation failed',
      actor,
      teamId,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid role assignment' },
      { status: 403 }
    );
  }

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
      action: 'team.member.add.auto',
      status: 'ERROR',
      message: 'User not found',
      actor,
  metadata: { email: redactEmail(normEmail) },
    });
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Enforce member limit
    try {
      const limit = await canAddTeamMember(teamId)
      if (!limit.allowed) {
        await logAudit({ action: 'team.member.add.auto', status: 'DENIED', actor, teamId, message: 'Member limit reached', metadata: { current: limit.current, max: limit.max } })
        return NextResponse.json({ error: 'Member limit reached. Upgrade your plan.' }, { status: 403 })
      }
    } catch {
      await logAudit({ action: 'team.member.limitCheck', status: 'ERROR', actor, teamId, message: 'Failed to check member limit' })
    }
    const tm = await prisma.teamMember.create({
      data: { teamId, userId: user.id, role: targetRole },
      select: { id: true, teamId: true, userId: true, role: true },
    });
    await logAudit({
      action: 'team.member.add.auto',
      status: 'SUCCESS',
      actor,
      teamId,
      target: { table: 'TeamMember', id: tm.id },
  metadata: { email: redactEmail(normEmail), role: role ?? 'MEMBER' },
    });

    // If the invited user's email is not verified, send a verification email
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
        await logAudit({
          action: 'team.member.add.auto.sendVerification',
          status: 'ERROR',
          actor,
          teamId,
          message: 'Failed to send verification email',
          metadata: { email: redactEmail(normEmail) },
        });
      }
    }
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
