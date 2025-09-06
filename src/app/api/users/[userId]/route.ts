import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';
import { logAudit } from '@lib/logger';
import { hmacEmail, encryptEmail, normalizeEmail, redactEmail } from '@lib/crypto';

// Admin-only: update another user's basic info (name, email, role)
// Guards:
// - Must be ADMIN
// - Must share at least one team with the target (as owner or member)
// - Optional: cannot edit without intersection
export async function PATCH(
  req: Request,
  context: RouteContext<'/api/users/[userId]'>,
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId: userIdParam } = await context.params;
  const targetUserId = userIdParam;
  if (!targetUserId)
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  let body: {
    name?: string;
    email?: string;
    role?: 'USER' | 'ADMIN';
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const email = typeof body.email === 'string' ? body.email.trim() : undefined;
  const normEmail = email ? normalizeEmail(email) : undefined;
  const role =
    body.role === 'USER' || body.role === 'ADMIN' ? body.role : undefined;

  if (!name && !email && !role) {
    return NextResponse.json({ message: 'No changes' });
  }

  // Ensure the admin shares at least one team with the target user
  const [adminTeamIds, targetTeamIds] = await Promise.all([
    (async () => {
      const memberTeams = await prisma.teamMember.findMany({
        where: { userId: session.userId },
        select: { teamId: true },
      });
      const ownedTeams = await prisma.team.findMany({
        where: { ownerId: session.userId },
        select: { id: true },
      });
      return new Set<string>([
        ...memberTeams.map((t) => t.teamId),
        ...ownedTeams.map((t) => t.id),
      ]);
    })(),
    (async () => {
      const memberTeams = await prisma.teamMember.findMany({
        where: { userId: targetUserId },
        select: { teamId: true },
      });
      const ownedTeams = await prisma.team.findMany({
        where: { ownerId: targetUserId },
        select: { id: true },
      });
      return new Set<string>([
        ...memberTeams.map((t) => t.teamId),
        ...ownedTeams.map((t) => t.id),
      ]);
    })(),
  ]);

  const sharesTeam = Array.from(adminTeamIds).some((id) =>
    targetTeamIds.has(id),
  );
  if (!sharesTeam)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Load current target user to compare changes
  const current = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!current)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const emailChanged =
    typeof normEmail === 'string' &&
    normEmail.length > 0 &&
    normEmail !== (current.email ? current.email.toLowerCase() : '');

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: current.id },
        data: {
          ...(name ? { name } : {}),
          ...(emailChanged
            ? {
                // clear plaintext email and set privacy-preserving fields
                email: null,
                emailHmac: hmacEmail(normEmail!),
                emailEnc: encryptEmail(normEmail!),
                emailVerified: false,
              }
            : {}),
          ...(role ? { role } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      let token: string | null = null;
      if (emailChanged && email) {
        token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await tx.emailVerificationToken.create({
          data: { userId: updated.id, token, expiresAt },
        });
      }

      return { updated, token };
    });

  if (emailChanged && result.token && normEmail) {
      try {
        await sendVerificationEmail({
      to: normEmail,
          name: name ?? current.name,
          token: result.token,
        });
      } catch {
        await logAudit({
          action: 'user.update.admin.sendVerification',
          status: 'ERROR',
          actor: session,
          message: 'Failed to send verification email',
        });
      }
    }

    await logAudit({
      action: 'user.update.admin',
      status: 'SUCCESS',
      actor: session,
      metadata: {
        targetUserId: current.id,
        nameChanged: Boolean(name && name !== current.name),
        emailChanged,
        email: emailChanged && normEmail ? redactEmail(normEmail) : undefined,
        roleChanged: Boolean(role && role !== current.role),
      },
    });

    return NextResponse.json({
      message: emailChanged
        ? 'User updated. Verification email sent to the new address.'
        : 'User updated.',
      user: result.updated,
    });
  } catch (e: unknown) {
    const err = e as { code?: string; meta?: { target?: string[] } } | null;
    if (err && (err.code === 'P2002' || err.meta?.target?.includes('email'))) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
