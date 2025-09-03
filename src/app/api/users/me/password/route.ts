import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { hashPassword, verifyPassword } from '@lib/auth';
import { logAudit } from '@lib/logger';

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword?.trim() ?? '';
    const newPassword = body.newPassword?.trim() ?? '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Password policy: 8-16 characters (align with registration forms)
    if (newPassword.length < 8 || newPassword.length > 16) {
      return NextResponse.json(
        { error: 'Password must be 8-16 characters' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, role: true, password: true },
    });
    if (!user)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      await logAudit({
        action: 'user.password.change',
        status: 'DENIED',
        actor: session,
        message: 'Invalid current password',
      });
      return NextResponse.json(
        { error: 'Invalid current password' },
        { status: 403 },
      );
    }

    // Optional: disallow setting the same password
    const sameAsBefore = await verifyPassword(newPassword, user.password);
    if (sameAsBefore) {
      return NextResponse.json(
        { error: 'New password must be different' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    await logAudit({
      action: 'user.password.change',
      status: 'SUCCESS',
      actor: session,
    });

    return NextResponse.json({ message: 'Password updated' });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'user.password.change',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
