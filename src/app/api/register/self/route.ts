import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { hashPassword } from '@lib/auth';
// import { setSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';
import { hmacEmail, encryptEmail, normalizeEmail, redactEmail } from '@lib/crypto';

export async function POST(req: Request) {
  try {
  const { name, email, password, teamName } = await req.json();
  const normEmail = email ? normalizeEmail(email) : '';

    if (!name || !email || !password || !teamName) {
      await logAudit({
        action: 'user.register.self',
        status: 'ERROR',
        message: 'Missing fields',
        metadata: { name, email: email ? redactEmail(normEmail) : null, teamName: teamName ?? null },
      });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Password requirements: 8-16 characters
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 16
    ) {
      await logAudit({
        action: 'user.register.self',
        status: 'ERROR',
        message: 'Invalid password length',
        metadata: { email: redactEmail(normEmail) },
      });
      return NextResponse.json(
        { error: 'Password must be 8-16 characters' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          // new path (after backfill)
          { emailHmac: hmacEmail(normEmail) },
          // fallback to plaintext unique (case-insensitive)
          { email: { equals: normEmail, mode: 'insensitive' } },
        ],
      },
    });
    if (existingUser) {
      await logAudit({
        action: 'user.register.self',
        status: 'DENIED',
        message: 'User already exists',
        metadata: { email: redactEmail(normEmail) },
      });
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
      // Create user
      const createdUser = await tx.user.create({
        data: {
          name,
          // explicitly omit plaintext email
          email: undefined,
          emailHmac: hmacEmail(normEmail),
          emailEnc: encryptEmail(normEmail),
          password: passwordHash,
          role: 'ADMIN',
        },
        select: {
          id: true,
          name: true,
      // do not select plaintext email
          role: true,
          createdAt: true,
        },
      });

      // Create team owned by this user
      const team = await tx.team.create({
        data: { name: teamName, ownerId: createdUser.id },
        select: { id: true, name: true, ownerId: true, createdAt: true },
      });

      // Assign FREE package (by slug) as an initial subscription if exists
      const freePkg = await tx.package.findUnique({ where: { slug: 'free' }, select: { id: true, monthlyCents: true } });
      if (freePkg) {
        await tx.teamSubscription.create({
          data: {
            teamId: team.id,
            packageId: freePkg.id,
            isActive: true,
            isAnnual: false,
            priceCents: 0, // free tier
            seats: null,
            metadata: { assignedOnRegistration: true },
          },
        });
      }

      // Add membership as OWNER
      await tx.teamMember.create({
        data: { teamId: team.id, userId: createdUser.id, role: 'OWNER' },
      });

      // Create email verification token (valid for 24h)
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tx.emailVerificationToken.create({
        data: { userId: createdUser.id, token, expiresAt },
      });

      return { createdUser, team, token };
    });

    // Send verification email (best-effort)
    try {
      await sendVerificationEmail({
        to: normEmail,
        name: result.createdUser.name,
        token: result.token,
      });
    } catch {
      await logAudit({
        action: 'user.register.self.sendVerification',
        status: 'ERROR',
        message: 'Failed to send verification email',
        metadata: { email: redactEmail(normEmail) },
      });
    }

    await logAudit({
      action: 'user.register.self',
      status: 'SUCCESS',
      actor: {
        userId: result.createdUser.id,
        name: result.createdUser.name,
        role: result.createdUser.role as 'USER' | 'ADMIN',
      },
      metadata: { teamId: result.team.id, emailSent: true },
    });
    return NextResponse.json(
      {
        message:
          'Account created. Please check your email to verify your address before logging in.',
        user: {
          id: result.createdUser.id,
          name: result.createdUser.name,
          email: normEmail, // returned for display only, not read from DB
          role: result.createdUser.role,
          createdAt: result.createdUser.createdAt,
        },
        team: result.team,
      },
      { status: 201 },
    );
  } catch (err) {
    await logAudit({
      action: 'user.register.self',
      status: 'ERROR',
      message: 'Server error',
    });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
