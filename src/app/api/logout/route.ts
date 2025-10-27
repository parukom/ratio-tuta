import { NextResponse } from 'next/server';
import { clearSession, getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { prisma } from '@lib/prisma';

export async function POST() {
  // SECURITY FIX: Revoke all sessions server-side on logout
  let userId: string | undefined;
  try {
    // Get current session to identify the user
    const session = await getSession({ skipDbCheck: true });
    if (session) {
      userId = session.userId;

      // Update sessionRevokedAt to invalidate all existing tokens
      await prisma.user.update({
        where: { id: userId },
        data: { sessionRevokedAt: new Date() },
      });

      await logAudit({
        action: 'auth.logout',
        status: 'SUCCESS',
        actor: session,
        message: 'All sessions revoked',
      });
    } else {
      await logAudit({
        action: 'auth.logout',
        status: 'SUCCESS',
        message: 'No active session',
      });
    }
  } catch (e) {
    console.warn('[logout] failed to revoke sessions', e);
    // Continue with cookie deletion even if DB update fails
    await logAudit({
      action: 'auth.logout',
      status: 'ERROR',
      message: 'Failed to revoke sessions server-side',
    });
  }

  // Clear session cookie using the proper clearSession function
  try {
    await clearSession();
  } catch (e) {
    console.warn('[logout] failed to clear session', e);
  }

  // Return response with additional cookie deletion header as backup
  const res = NextResponse.json({ ok: true }, { status: 200 });

  // Set both possible cookie names to expired (dev and prod)
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };

  res.cookies.set('ratio-tuta-session', '', cookieOptions);
  res.cookies.set('__Host-ratio-tuta-session', '', cookieOptions);

  return res;
}
