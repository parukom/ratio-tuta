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
import { sendPasswordResetEmail } from '@lib/mail';

// POST /api/password/forgot { email }
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

    // Find user (support legacy plaintext fallback)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailHmac: emailH },
          { email: { equals: norm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        emailEnc: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user || !user.emailVerified) {
      // Always respond success to avoid user enumeration
      await logAudit({
        action: 'auth.password.forgot',
        status: 'DENIED',
        message: 'User not found or unverified',
        metadata: { email: redactEmail(null, emailH) },
      });
      return NextResponse.json({
        message: 'If that email exists, a reset link was sent.',
      });
    }

    // Create token (one hour expiry). Optionally invalidate previous tokens.
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    // Clean old/used tokens for this user to keep table small (best-effort)
    // ts-ignore to avoid transient type error if generated client not yet picked up by dev server
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Decrypt or fallback to plaintext email for sending
    let emailPlain: string | null = null;
    try {
      if (user.emailEnc) emailPlain = decryptEmail(user.emailEnc);
    } catch {
      /* ignore */
    }
    if (!emailPlain) emailPlain = user.email ?? norm;

    try {
      await sendPasswordResetEmail({ to: emailPlain, name: user.name, token });
    } catch {
      await logAudit({
        action: 'auth.password.forgot.send',
        status: 'ERROR',
        message: 'Failed to send',
        metadata: { email: redactEmail(emailPlain) },
      });
      // Still return generic success (avoid enumeration)
      return NextResponse.json({
        message: 'If that email exists, a reset link was sent.',
      });
    }

    await logAudit({
      action: 'auth.password.forgot',
      status: 'SUCCESS',
      metadata: { email: redactEmail(emailPlain) },
    });
    return NextResponse.json({
      message: 'If that email exists, a reset link was sent.',
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.password.forgot',
      status: 'ERROR',
      message: 'Server error',
    });
    // To keep UX consistent, still respond 200
    return NextResponse.json({
      message: 'If that email exists, a reset link was sent.',
    });
  }
}
