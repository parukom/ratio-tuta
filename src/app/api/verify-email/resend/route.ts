import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';
import {
  hmacEmail,
  normalizeEmail,
  redactEmail,
  decryptEmail,
} from '@lib/crypto';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';

// POST /api/verify-email/resend { email }
// Always returns a generic success message to avoid user enumeration.
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      email?: string;
    } | null;
    const emailRaw = body?.email?.trim() || '';
    if (!emailRaw) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const norm = normalizeEmail(emailRaw);
    const emailH = hmacEmail(norm);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailHmac: emailH },
          { email: { equals: norm, mode: 'insensitive' } }, // legacy plaintext fallback
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailEnc: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      // Pretend success; either user missing or already verified.
      await logAudit({
        action: 'auth.verifyEmail.resend',
        status: 'DENIED',
        message: 'User not found or already verified',
        metadata: { email: redactEmail(null, emailH) },
      });
      return NextResponse.json({
        message: 'If that account exists, a verification email was sent.',
      });
    }

    // Delete existing (expired or active) tokens for this user to keep only one active.
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });
    } catch {
      /* ignore */
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    let emailPlain: string | null = null;
    try {
      if (user.emailEnc) emailPlain = decryptEmail(user.emailEnc);
    } catch {
      /* ignore */
    }
    if (!emailPlain) emailPlain = user.email ?? norm;

    try {
      await sendVerificationEmail({ to: emailPlain, name: user.name, token });
    } catch {
      await logAudit({
        action: 'auth.verifyEmail.resend.send',
        status: 'ERROR',
        message: 'Failed to send',
        metadata: { email: redactEmail(emailPlain) },
      });
      // Still respond generic
      return NextResponse.json({
        message: 'If that account exists, a verification email was sent.',
      });
    }

    await logAudit({
      action: 'auth.verifyEmail.resend',
      status: 'SUCCESS',
      metadata: { email: redactEmail(emailPlain) },
    });
    return NextResponse.json({
      message: 'If that account exists, a verification email was sent.',
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.verifyEmail.resend',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({
      message: 'If that account exists, a verification email was sent.',
    });
  }
}
