import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { verifyPassword } from '@lib/auth';
import { setSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      await logAudit({
        action: 'auth.login',
        status: 'ERROR',
        message: 'Missing fields',
        metadata: { email },
      });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logAudit({
        action: 'auth.login',
        status: 'DENIED',
        message: 'Invalid credentials (user not found)',
        metadata: { email },
      });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      await logAudit({
        action: 'auth.login',
        status: 'DENIED',
        message: 'Invalid credentials (bad password)',
        metadata: { email },
      });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    await setSession({
      userId: user.id,
      name: user.name,
      role: user.role as 'USER' | 'ADMIN',
    });

    await logAudit({
      action: 'auth.login',
      status: 'SUCCESS',
      actor: {
        userId: user.id,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
      },
      metadata: { email },
    });
    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { status: 200 },
    );
  } catch (err) {
    await logAudit({
      action: 'auth.login',
      status: 'ERROR',
      message: 'Server error',
    });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
