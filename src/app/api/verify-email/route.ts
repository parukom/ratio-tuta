import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';

// GET /api/verify-email?token=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    await logAudit({
      action: 'auth.verifyEmail',
      status: 'ERROR',
      message: 'Missing token',
    });
    const url = new URL('/auth?form=login&verify=invalid', req.url);
    return NextResponse.redirect(url);
  }

  try {
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });
    if (!record) {
      await logAudit({
        action: 'auth.verifyEmail',
        status: 'DENIED',
        message: 'Invalid token',
      });
      const url = new URL('/auth?form=login&verify=invalid', req.url);
      return NextResponse.redirect(url);
    }
    const now = new Date();
    if (record.expiresAt <= now) {
      // delete expired token
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      await logAudit({
        action: 'auth.verifyEmail',
        status: 'DENIED',
        message: 'Expired token',
      });
      const url = new URL('/auth?form=login&verify=invalid', req.url);
      return NextResponse.redirect(url);
    }

    // mark user as verified and delete token
    const user = await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
      select: { id: true, email: true, name: true },
    });
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });

    await logAudit({
      action: 'auth.verifyEmail',
      status: 'SUCCESS',
      actor: { userId: user.id, name: user.name, role: 'USER' },
    });

    // Redirect to login after successful verification
    const url = new URL('/auth?form=login&verify=success', req.url);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.verifyEmail',
      status: 'ERROR',
      message: 'Server error',
    });
    const url = new URL('/auth?form=login&verify=error', req.url);
    return NextResponse.redirect(url);
  }
}
