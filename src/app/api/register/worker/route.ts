import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { hashPassword } from '@lib/auth';
import { getSession } from '@lib/session';
import { randomBytes } from 'crypto';
import { logAudit } from '@lib/logger';
import { sendInviteEmail } from '@lib/mail';
import {
  hmacEmail,
  encryptEmail,
  normalizeEmail,
  redactEmail,
} from '@lib/crypto';

// Protected endpoint: register someone else (e.g., worker)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      await logAudit({
        action: 'user.register.worker',
        status: 'DENIED',
        message: 'Unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, role, teamId } = (await req.json()) as {
      name: string;
      email: string;
      password?: string;
      role?: 'USER' | 'ADMIN';
      teamId?: string;
    };
    const normEmail = email ? normalizeEmail(email) : '';

    if (!name || !email) {
      await logAudit({
        action: 'user.register.worker',
        status: 'ERROR',
        message: 'Missing fields',
        actor: session,
      });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        emailHmac: hmacEmail(normEmail),
      },
    });
    if (existingUser) {
      await logAudit({
        action: 'user.register.worker',
        status: 'DENIED',
        message: 'User already exists',
        actor: session,
        metadata: { email: redactEmail(normEmail) },
      });
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    let targetTeamId: string | undefined = undefined;
    if (typeof teamId === 'string' && teamId) {
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
      if (!ok) {
        await logAudit({
          action: 'user.register.worker',
          status: 'DENIED',
          message: 'Forbidden teamId',
          actor: session,
          metadata: { teamId },
        });
        return NextResponse.json(
          { error: 'Forbidden teamId' },
          { status: 403 },
        );
      }
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
        new Set<string>([
          ...owned.map((t) => t.id),
          ...memberOf.map((t) => t.teamId),
        ]),
      );
      if (teamIds.length === 1) targetTeamId = teamIds[0];
      if (teamIds.length === 0) {
        await logAudit({
          action: 'user.register.worker',
          status: 'ERROR',
          message: 'Requester not in any team',
          actor: session,
        });
        return NextResponse.json(
          { error: 'Requester is not in any team' },
          { status: 400 },
        );
      }
      if (teamIds.length > 1) {
        await logAudit({
          action: 'user.register.worker',
          status: 'ERROR',
          message: 'Multiple teams; provide teamId',
          actor: session,
          metadata: { teamIds },
        });
        return NextResponse.json(
          { error: 'Multiple teams found; provide teamId' },
          { status: 400 },
        );
      }
    }

    // If password provided, validate length (8-16). If not, auto-generate.
    if (
      typeof password === 'string' &&
      (password.length < 8 || password.length > 16)
    ) {
      await logAudit({
        action: 'user.register.worker',
        status: 'ERROR',
        message: 'Invalid password length',
        actor: session,
        metadata: { email: redactEmail(normEmail) },
      });
      return NextResponse.json(
        { error: 'Password must be 8-16 characters' },
        { status: 400 },
      );
    }
    const finalPassword = password ?? randomBytes(12).toString('base64url');
    const userRole: 'USER' | 'ADMIN' = role ?? 'USER';
    const passwordHash = await hashPassword(finalPassword);
    let verificationToken: string | null = null;
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          emailHmac: hmacEmail(normEmail),
          emailEnc: encryptEmail(normEmail),
          password: passwordHash,
          role: userRole,
        },
        select: {
          id: true,
          name: true,
          // do not select plaintext email
          role: true,
          createdAt: true,
        },
      });
      // Attach to team (unique on userId will ensure single-team membership)
      await tx.teamMember.create({
        data: { teamId: targetTeamId!, userId: created.id, role: 'MEMBER' },
      });
      // Create an email verification token (valid for 24h) so the invited user can verify
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx.emailVerificationToken.create({
        data: { userId: created.id, token, expiresAt },
      });
      // Pass token outside transaction for emailing
      verificationToken = token;
      return created;
    });

    await logAudit({
      action: 'user.register.worker',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      target: { table: 'User', id: user.id },
      metadata: { email: redactEmail(normEmail) },
    });
    const responseBody: Record<string, unknown> = {
      user: { ...user, email: normEmail }, // include email from input for display only
    };
    if (!password) {
      responseBody.generatedPassword = finalPassword;
    }

    // Fire invitation email (includes initial password) and verification link (best-effort)
    try {
      if (verificationToken) {
        await sendInviteEmail({
          to: normEmail,
          name: user.name,
          password: finalPassword,
          token: verificationToken,
        });
      }
    } catch {
      await logAudit({
        action: 'user.register.worker.sendInvite',
        status: 'ERROR',
        actor: session,
        teamId: targetTeamId!,
        message: 'Failed to send invite email',
        metadata: { email: redactEmail(normEmail) },
      });
    }
    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    await logAudit({
      action: 'user.register.worker',
      status: 'ERROR',
      message: 'Server error',
    });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
