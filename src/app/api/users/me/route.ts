import { NextResponse } from 'next/server';
import { getSession, setSession, clearSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@lib/mail';

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      avatarUrl: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const firstName =
      typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
    const lastName =
      typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
    const email =
      typeof body.email === 'string' ? body.email.trim() : undefined;

    // Load current user to compare changes
    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!current)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build updates
    let nextName: string | undefined;
    if (firstName !== undefined || lastName !== undefined) {
      const curParts = (current.name || '').trim().split(/\s+/);
      const curFirst = curParts[0] ?? '';
      const curLast = curParts.slice(1).join(' ');
      const nf = firstName !== undefined ? firstName : curFirst;
      const nl = lastName !== undefined ? lastName : curLast;
      nextName = [nf, nl].filter(Boolean).join(' ').trim();
    }

    const emailChanged =
      email !== undefined &&
      email.toLowerCase() !== current.email.toLowerCase();

    // If nothing to update
    if (!nextName && !emailChanged) {
      return NextResponse.json({
        message: 'No changes',
        user: {
          id: current.id,
          name: current.name,
          email: current.email,
          role: current.role,
        },
      });
    }

    // Perform updates in a transaction; if email changes, mark unverified and create token
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: current.id },
        data: {
          ...(nextName ? { name: nextName } : {}),
          ...(emailChanged ? { email, emailVerified: false } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      let token: string | null = null;
      if (emailChanged && email) {
        token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await tx.emailVerificationToken.create({
          data: { userId: updated.id, token, expiresAt },
        });
      }
      return { updated, token };
    });

    // Fire verification email outside transaction
    if (emailChanged && result.token) {
      try {
        await sendVerificationEmail({
          to: email!,
          name: nextName ?? current.name,
          token: result.token,
        });
      } catch {
        // Log but don't fail the whole request
        await logAudit({
          action: 'user.update.email.sendVerification',
          status: 'ERROR',
          actor: session,
          message: 'Failed to send verification email',
        });
      }
    }

    // Update cookie session if name changed
    if (nextName) {
      await setSession({
        userId: session.userId,
        name: nextName,
        role: session.role,
      });
    }

    await logAudit({
      action: 'user.update.me',
      status: 'SUCCESS',
      actor: {
        userId: result.updated.id,
        name: result.updated.name,
        role: result.updated.role as 'USER' | 'ADMIN',
      },
      metadata: { nameChanged: Boolean(nextName), emailChanged },
    });

    return NextResponse.json({
      message: emailChanged
        ? 'Profile updated. Please verify your new email address.'
        : 'Profile updated.',
      user: result.updated,
    });
  } catch (e: unknown) {
    // Unique constraint (email)
    const err = e as
      | { code?: string; meta?: { target?: string[] } }
      | undefined;
    if (err && (err.code === 'P2002' || err.meta?.target?.includes('email'))) {
      await logAudit({
        action: 'user.update.me',
        status: 'DENIED',
        message: 'Email already in use',
      });
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 },
      );
    }

    console.error(e);
    await logAudit({
      action: 'user.update.me',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const userId = session.userId;

      // Find teams owned by this user
      const ownedTeams = await tx.team.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const teamIds = ownedTeams.map((t) => t.id);

      // Helper to delete all data for given teams
      async function deleteTeams(ids: string[]) {
        if (ids.length === 0) return;

        const memberRows = await tx.teamMember.findMany({
          where: { teamId: { in: ids } },
          select: { userId: true },
        });
        const memberUserIds = Array.from(
          new Set(memberRows.map((m) => m.userId).concat(userId)),
        );

        const places = await tx.place.findMany({
          where: { teamId: { in: ids } },
          select: { id: true },
        });
        const placeIds = places.map((p) => p.id);

        const teamItems = await tx.item.findMany({
          where: { teamId: { in: ids } },
          select: { id: true },
        });
        const itemIds = teamItems.map((i) => i.id);

        // Delete receipt items for receipts in these places
        if (placeIds.length) {
          const placeReceipts = await tx.receipt.findMany({
            where: { placeId: { in: placeIds } },
            select: { id: true },
          });
          const receiptIds = placeReceipts.map((r) => r.id);
          if (receiptIds.length) {
            await tx.receiptItem.deleteMany({
              where: { receiptId: { in: receiptIds } },
            });
            await tx.receipt.deleteMany({ where: { id: { in: receiptIds } } });
          }
        }

        // Also delete receipt items referencing team items anywhere (safety)
        if (itemIds.length) {
          await tx.receiptItem.deleteMany({
            where: { itemId: { in: itemIds } },
          });
        }

        if (placeIds.length) {
          await tx.placeMember.deleteMany({
            where: { placeId: { in: placeIds } },
          });
          await tx.placeItem.deleteMany({
            where: { placeId: { in: placeIds } },
          });
          await tx.place.deleteMany({ where: { id: { in: placeIds } } });
        }

        // Team-scoped taxonomies and catalog
        if (ids.length) {
          await tx.item.deleteMany({ where: { teamId: { in: ids } } });
          await tx.itemCategory.deleteMany({ where: { teamId: { in: ids } } });
          await tx.placeType.deleteMany({ where: { teamId: { in: ids } } });
          await tx.teamMember.deleteMany({ where: { teamId: { in: ids } } });
          await tx.auditLog.deleteMany({ where: { teamId: { in: ids } } });
          await tx.team.deleteMany({ where: { id: { in: ids } } });
        }

        // Delete all member users and their personal data
        if (memberUserIds.length) {
          // Delete receipts and receipt items by users
          const userReceipts = await tx.receipt.findMany({
            where: { userId: { in: memberUserIds } },
            select: { id: true },
          });
          const userReceiptIds = userReceipts.map((r) => r.id);
          if (userReceiptIds.length) {
            await tx.receiptItem.deleteMany({
              where: { receiptId: { in: userReceiptIds } },
            });
            await tx.receipt.deleteMany({
              where: { id: { in: userReceiptIds } },
            });
          }

          await tx.emailVerificationToken.deleteMany({
            where: { userId: { in: memberUserIds } },
          });
          await tx.auditLog.deleteMany({
            where: { actorUserId: { in: memberUserIds } },
          });
          await tx.placeMember.deleteMany({
            where: { userId: { in: memberUserIds } },
          });
          await tx.teamMember.deleteMany({
            where: { userId: { in: memberUserIds } },
          });

          await tx.user.deleteMany({ where: { id: { in: memberUserIds } } });
        }
      }

      if (teamIds.length) {
        await deleteTeams(teamIds);
      } else {
        // User does not own teams: delete their personal data and account
        const receipts = await tx.receipt.findMany({
          where: { userId: userId },
          select: { id: true },
        });
        const rIds = receipts.map((r) => r.id);
        if (rIds.length) {
          await tx.receiptItem.deleteMany({
            where: { receiptId: { in: rIds } },
          });
          await tx.receipt.deleteMany({ where: { id: { in: rIds } } });
        }
        await tx.emailVerificationToken.deleteMany({ where: { userId } });
        await tx.auditLog.deleteMany({ where: { actorUserId: userId } });
        await tx.placeMember.deleteMany({ where: { userId } });
        await tx.teamMember.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      }

      return { deletedTeams: teamIds.length };
    });

    await clearSession();

    await logAudit({
      action: 'user.delete.account',
      status: 'SUCCESS',
      actor: session,
      metadata: { deletedTeams: result.deletedTeams },
    });

    return NextResponse.json({ message: 'Account deleted' });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'user.delete.account',
      status: 'ERROR',
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
