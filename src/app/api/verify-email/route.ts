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
    // SECURITY FIX: Constant-time validation to prevent timing attacks
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    const now = new Date();
    let isValid = false;
    let denialReason = 'Invalid token';

    if (record) {
      if (record.expiresAt > now) {
        isValid = true;
      } else {
        denialReason = 'Expired token';
        // Delete expired token
        await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {});
      }
    }

    // Constant-time response - same error for all failure cases
    if (!isValid) {
      await logAudit({
        action: 'auth.verifyEmail',
        status: 'DENIED',
        message: denialReason,
      });
      const url = new URL('/auth?form=login&verify=invalid', req.url);
      return NextResponse.redirect(url);
    }

    // TypeScript: At this point, record is guaranteed to be non-null
    if (!record) {
      throw new Error('Unexpected: record is null after validation');
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
