import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import type { Prisma } from '@/generated/prisma';
import { hmacEmail, normalizeEmail, redactEmail, decryptEmail } from '@lib/crypto';

// GET /api/places/[placeId]/members -> list assigned users
export async function GET(
  _req: Request,
  context: RouteContext<'/api/places/[placeId]/members'>,
) {
  try {
    const { placeId: placeIdParam } = await context.params;
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const placeId = placeIdParam;
    if (!placeId || typeof placeId !== 'string')
      return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

    const place = await prisma.place.findUnique({
      select: { id: true, teamId: true },
      where: { id: placeId },
    });
    if (!place)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    const allowed = await prisma.team.findFirst({
      where: {
        id: place.teamId,
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      select: { id: true },
    });
    if (!allowed)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const rows = await prisma.placeMember.findMany({
      where: { placeId },
      select: { id: true, userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const ids = Array.from(new Set(rows.map(r => r.userId)));
    const users = ids.length
      ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, emailEnc: true } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u] as const));
    const members = rows.map((r) => {
      const u = userMap.get(r.userId);
      return {
        id: r.id,
        userId: r.userId,
        name: u?.name ?? 'Unknown',
        email: u?.emailEnc ? decryptEmail(u.emailEnc) : 'unknown',
        createdAt: r.createdAt,
      };
    });
    return NextResponse.json(members);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error('GET /api/places/[placeId]/members failed', err);
    await logAudit({
      action: 'place.members.list',
      status: 'ERROR',
      message: 'Server error',
      metadata: { code: err?.code || null, message: typeof err?.message === 'string' ? err.message : null } as Prisma.InputJsonValue,
    });
    const detail = typeof err?.message === 'string' ? { message: err.message, code: err?.code } : undefined;
    return NextResponse.json({ error: 'Server error', detail: process.env.NODE_ENV !== 'production' ? detail : undefined }, { status: 500 });
  }
}

// POST /api/places/[placeId]/members -> add a user to a place by email or userId
export async function POST(
  req: Request,
  context: RouteContext<'/api/places/[placeId]/members'>,
) {
  try {
    const { placeId: placeIdParam } = await context.params;
    const session = await getSession();
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const placeId = placeIdParam;
    if (!placeId || typeof placeId !== 'string')
      return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

    const place = await prisma.place.findUnique({
      select: { id: true, teamId: true },
      where: { id: placeId },
    });
    if (!place)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    // requester must belong to team
    const allowed = await prisma.team.findFirst({
      where: {
        id: place.teamId,
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      select: { id: true },
    });
    if (!allowed)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { email?: string; userId?: string } | null;
  const email = body?.email;
    const userId = body?.userId;
    if (!email && !userId)
      return NextResponse.json({ error: 'email or userId required' }, { status: 400 });

    // resolve target user
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst({
          where: {
            emailHmac: hmacEmail(normalizeEmail(String(email))),
          },
        });
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Ensure target user belongs to team
    const targetInTeam = await prisma.team.findFirst({
      where: {
        id: place.teamId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      select: { id: true },
    });
    if (!targetInTeam) {
      return NextResponse.json(
        { error: 'User is not in the team' },
        { status: 400 },
      );
    }

  try {
      const pm = await prisma.placeMember.create({
        data: { placeId, userId: user.id },
        select: { id: true, placeId: true, userId: true },
      });
      await logAudit({
        action: 'place.member.add',
        status: 'SUCCESS',
        actor: session,
        teamId: place.teamId,
        target: { table: 'PlaceMember', id: pm.id },
        metadata: { placeId, userId: user.id },
      });
      return NextResponse.json(pm, { status: 201 });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'User already assigned to place' },
          { status: 409 },
        );
      }
      if (err?.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference while assigning member' },
          { status: 400 },
        );
      }
      console.error('place.member.add failed', err);
      await logAudit({
        action: 'place.member.add',
        status: 'ERROR',
        actor: session,
        teamId: place.teamId,
        message: 'Server error',
        metadata: { code: err?.code || null, message: typeof err?.message === 'string' ? err.message : null } as Prisma.InputJsonValue,
      });
      const detail = typeof err?.message === 'string' ? { message: err.message, code: err?.code } : undefined;
      return NextResponse.json({ error: 'Server error', detail: process.env.NODE_ENV !== 'production' ? detail : undefined }, { status: 500 });
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error('POST /api/places/[placeId]/members failed', err);
    const detail = typeof err?.message === 'string' ? { message: err.message, code: err?.code } : undefined;
    return NextResponse.json({ error: 'Server error', detail: process.env.NODE_ENV !== 'production' ? detail : undefined }, { status: 500 });
  }
}

// DELETE /api/places/[placeId]/members -> remove user from place by userId
export async function DELETE(
  req: Request,
  context: RouteContext<'/api/places/[placeId]/members'>,
) {
  const { placeId: placeIdParam } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const body = (await req.json().catch(() => null)) as { userId?: string } | null;
  const userId = body?.userId;
  if (!userId)
    return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const place = await prisma.place.findUnique({
    select: { id: true, teamId: true },
    where: { id: placeId },
  });
  if (!place)
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });

  const allowed = await prisma.team.findFirst({
    where: {
      id: place.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.placeMember.delete({
      where: { placeId_userId: { placeId, userId } },
    });
    await logAudit({
      action: 'place.member.remove',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'PlaceMember', id: `${placeId}:${userId}` },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'place.member.remove',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
