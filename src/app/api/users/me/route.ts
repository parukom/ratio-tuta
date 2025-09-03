import { NextResponse } from 'next/server';
import { getSession, setSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const firstName =
      typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName =
      typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const email =
      typeof body.email === 'string' ? body.email.trim() : undefined;

    // Load current user to compare changes
    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!current)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build updates
    let nextName: string | undefined;
    if (firstName !== undefined || lastName !== undefined) {
      const curParts = (current.name || '').trim().split(/\s+/);
      const curFirst = curParts[0] ?? '';
      const curLast = curParts.slice(1).join(' ');
      const nf = firstName !== undefined ? firstName : curFirst;
      const nl = lastName !== undefined ? lastName : curLast;
      nextName = [nf, nl].filter(Boolean).join(' ').trim();
    }

    const emailChanged =
      email !== undefined &&
      email.toLowerCase() !== current.email.toLowerCase();

    // If nothing to update
    if (!nextName && !emailChanged) {
      return NextResponse.json({
        message: 'No changes',
        user: {
          id: current.id,
          name: current.name,
          email: current.email,
          role: current.role,
        },
      });
    }

    // Perform updates in a transaction; if email changes, mark unverified and create token
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: current.id },
        data: {
          ...(nextName ? { name: nextName } : {}),
          ...(emailChanged ? { email, emailVerified: false } : {}),
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

    // Fire verification email outside transaction
    if (emailChanged && result.token) {
      try {
        await sendVerificationEmail({
          to: email!,
          name: nextName ?? current.name,
          token: result.token,
        });
      } catch {
        // Log but don't fail the whole request
        await logAudit({
          action: 'user.update.email.sendVerification',
          status: 'ERROR',
          actor: session,
          message: 'Failed to send verification email',
        });
      }
    }

    // Update cookie session if name changed
    if (nextName) {
      await setSession({
        userId: session.userId,
        name: nextName,
        role: session.role,
      });
    }

    await logAudit({
      action: 'user.update.me',
      status: 'SUCCESS',
      actor: {
        userId: result.updated.id,
        name: result.updated.name,
        role: result.updated.role as 'USER' | 'ADMIN',
      },
      metadata: { nameChanged: Boolean(nextName), emailChanged },
    });

    return NextResponse.json({
      message: emailChanged
        ? 'Profile updated. Please verify your new email address.'
        : 'Profile updated.',
      user: result.updated,
    });
  } catch (e: unknown) {
    // Unique constraint (email)
    const err = e as
      | { code?: string; meta?: { target?: string[] } }
      | undefined;
    if (err && (err.code === 'P2002' || err.meta?.target?.includes('email'))) {
      await logAudit({
        action: 'user.update.me',
        status: 'DENIED',
        message: 'Email already in use',
      });
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 },
      );
    }

    console.error(e);
    await logAudit({
      action: 'user.update.me',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
