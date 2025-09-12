import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';
import { hashPassword, verifyPassword } from '@lib/auth';

// POST /api/password/reset { token, password }
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      token?: string;
      password?: string;
    } | null;
    const token = body?.token?.trim() || '';
    const password = body?.password?.trim() || '';
    if (!token || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 16) {
      return NextResponse.json(
        { error: 'Password must be 8-16 characters' },
        { status: 400 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'DENIED',
        message: 'Invalid or expired token',
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, password: true, name: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    const same = await verifyPassword(password, user.password);
    if (same) {
      return NextResponse.json(
        { error: 'New password must be different' },
        { status: 400 },
      );
    }
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash, sessionRevokedAt: new Date() },
      });
      // mark token used
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      // delete other tokens for this user
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null, id: { not: record.id } },
      });
    });
    await logAudit({
      action: 'auth.password.reset',
      status: 'SUCCESS',
      actor: {
        userId: user.id,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
      },
    });
    return NextResponse.json({
      message: 'Password updated. You can now log in.',
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.password.reset',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
