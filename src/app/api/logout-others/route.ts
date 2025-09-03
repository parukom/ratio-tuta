import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession, setSession } from '@lib/session';
import { verifyPassword } from '@lib/auth';
import { logAudit } from '@lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { password } = await req.json();
    if (!password)
      return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      await logAudit({
        action: 'auth.logout_others',
        status: 'DENIED',
        actor: session,
        message: 'Invalid password',
      });
      return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
    }

    // Set the revocation timestamp to now; current cookie iat is before now,
    // so we will also clear the current cookie to keep the user signed in only here if desired.
    const now = new Date();
    await prisma.user.update({
      where: { id: session.userId },
      data: { sessionRevokedAt: now },
    });

    // Re-issue the current session so this device stays logged in
    await setSession({
      userId: session.userId,
      name: session.name,
      role: session.role,
    });

    await logAudit({
      action: 'auth.logout_others',
      status: 'SUCCESS',
      actor: session,
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.logout_others',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
