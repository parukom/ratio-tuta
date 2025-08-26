import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { hashPassword } from '@lib/auth';
import { setSession } from '@lib/session';

export async function POST(req: Request) {
  try {
    const { name, email, password, teamName } = await req.json();

    if (!name || !email || !password || !teamName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const createdUser = await tx.user.create({
        data: { name, email, password: passwordHash, role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Create team owned by this user
      const team = await tx.team.create({
        data: { name: teamName, ownerId: createdUser.id },
        select: { id: true, name: true, ownerId: true, createdAt: true },
      });

      // Add membership as OWNER
      await tx.teamMember.create({
        data: { teamId: team.id, userId: createdUser.id, role: 'OWNER' },
      });

      return { createdUser, team };
    });

    // Create session after successful registration
    await setSession({
      userId: result.createdUser.id,
      name: result.createdUser.name,
      role: result.createdUser.role as 'USER' | 'ADMIN',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
