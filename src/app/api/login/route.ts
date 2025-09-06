import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { verifyPassword } from '@lib/auth';
import { setSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { hmacEmail, decryptEmail, normalizeEmail, redactEmail } from '@lib/crypto';

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
        metadata: { email: email ? redactEmail(String(email)) : null },
      });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const emailH = hmacEmail(email);
    // Use findFirst to support either new HMAC field or legacy plaintext until migration completes
    const user = await prisma.user.findFirst({
      where: { OR: [{ emailHmac: emailH }, { email: { equals: normalizeEmail(email), mode: 'insensitive' } }] },
      select: {
        id: true,
        name: true,
        emailEnc: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      },
    });
    if (!user) {
      await logAudit({
        action: 'auth.login',
        status: 'DENIED',
        message: 'Invalid credentials (user not found)',
        metadata: { email: redactEmail(null, emailH) },
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
        metadata: { email: redactEmail(null, emailH) },
      });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      await logAudit({
        action: 'auth.login',
        status: 'DENIED',
        message: 'Email not verified',
        metadata: { email: redactEmail(null, emailH) },
      });
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 },
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
      metadata: { email: redactEmail(normalizeEmail(email)) },
    });
  // Prefer decrypted email if available; fallback to legacy plaintext field if present
  let emailPlain: string | null = null;
  try {
    if (user.emailEnc) emailPlain = decryptEmail(user.emailEnc);
  } catch {
    // ignore decrypt errors and fall back
  }
  if (!emailPlain) emailPlain = user.email ?? normalizeEmail(email);
    return NextResponse.json(
      { id: user.id, name: user.name, email: emailPlain, role: user.role },
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
