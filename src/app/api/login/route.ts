import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { verifyPassword } from '@lib/auth';
import { setSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { hmacEmail, decryptEmail, normalizeEmail, redactEmail } from '@lib/crypto';
import { rateLimit, authLimiter } from '@lib/rate-limit-redis';

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
    // Rate limiting: 5 login attempts per 15 minutes (skip in development)
    if (process.env.NODE_ENV !== 'development') {
      const rateLimitResult = await rateLimit(req, authLimiter);

      if (!rateLimitResult.success) {
        await logAudit({
          action: 'auth.login',
          status: 'DENIED',
          message: 'Rate limit exceeded',
        });
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining),
              'X-RateLimit-Reset': String(rateLimitResult.reset),
              'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            }
          }
        );
      }
    }

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
    // Find user by HMAC hash
    const user = await prisma.user.findUnique({
      where: { emailHmac: emailH },
      select: {
        id: true,
        name: true,
        emailEnc: true,
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
    // Decrypt email for response
    const emailPlain = decryptEmail(user.emailEnc);
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
