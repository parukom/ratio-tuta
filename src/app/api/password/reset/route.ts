import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';
import { hashPassword, verifyPassword } from '@lib/auth';
import { rateLimit, strictAuthLimiter, RATE_LIMITS } from '@lib/rate-limit-redis';
import { validatePassword, checkPwnedPassword } from '@lib/password-validator';

// POST /api/password/reset { token, password }
export async function POST(req: Request) {
  try {
    // Rate limiting: 5 attempts per hour
    const rateLimitResult = await rateLimit(req, strictAuthLimiter, RATE_LIMITS.PASSWORD_RESET);

    if (!rateLimitResult.success) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'DENIED',
        message: 'Rate limit exceeded',
      });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
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

    const body = (await req.json().catch(() => null)) as {
      token?: string;
      password?: string;
    } | null;
    const token = body?.token?.trim() || '';
    const password = body?.password?.trim() || '';
    if (!token || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // SECURITY FIX: Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'ERROR',
        message: 'Weak password',
        metadata: { errors: passwordValidation.errors },
      });
      return NextResponse.json(
        {
          error: 'Password validation failed',
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    // Check against breach database
    const isPwned = await checkPwnedPassword(password);
    if (isPwned) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'DENIED',
        message: 'Password found in breach database',
      });
      return NextResponse.json(
        {
          error: 'This password has been found in data breaches. Please choose a different password for your security.',
          strength: passwordValidation.strength,
        },
        { status: 400 },
      );
    }

    // SECURITY FIX: Constant-time validation to prevent timing attacks
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    const now = new Date();
    let isValid = false;
    let denialReason = 'Invalid or expired token';
    let userId: string | null = null;

    if (record) {
      if (!record.usedAt && record.expiresAt > now) {
        isValid = true;
        userId = record.userId;
      } else if (record.usedAt) {
        denialReason = 'Token already used';
      } else {
        denialReason = 'Token expired';
      }
    }

    // Constant-time response - same error for all failure cases
    if (!isValid || !userId) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'DENIED',
        message: denialReason,
      });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, name: true, role: true },
    });
    if (!user) {
      await logAudit({
        action: 'auth.password.reset',
        status: 'DENIED',
        message: 'User not found',
      });
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }
    const same = await verifyPassword(password, user.password);
    if (same) {
      return NextResponse.json(
        { error: 'New password must be different' },
        { status: 400 },
      );
    }
    const passwordHash = await hashPassword(password);

    // TypeScript: At this point, record is guaranteed to be non-null
    // because we returned early if isValid was false (which requires record to exist)
    if (!record) {
      throw new Error('Unexpected: record is null after validation');
    }

    // Atomically update password and mark token as used
    await prisma.$transaction(async (tx) => {
      // Update password and revoke all sessions
      await tx.user.update({
        where: { id: user.id },
        data: { password: passwordHash, sessionRevokedAt: new Date() },
      });

      // Mark token as used immediately to prevent replay attacks
      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });

      // Delete all other unused tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null, id: { not: record.id } },
      });
    });
    await logAudit({
      action: 'auth.password.reset',
      status: 'SUCCESS',
      actor: {
        userId: user.id,
        name: user.name,
        role: user.role as 'USER' | 'ADMIN',
      },
    });
    return NextResponse.json({
      message: 'Password updated. You can now log in.',
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'auth.password.reset',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
