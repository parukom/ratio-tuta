import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import type { Prisma } from '@/generated/prisma';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');

  // Teams current user belongs to (owner or member)
  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: session.userId },
      select: { teamId: true },
    }),
  ]);
  const myTeamIds = Array.from(
    new Set<string>([
      ...owned.map((t) => t.id),
      ...memberOf.map((t) => t.teamId),
    ]),
  );

  if (myTeamIds.length === 0) return NextResponse.json([]);

  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    const tid = teamIdParam;
    if (!myTeamIds.includes(tid))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [tid];
  }

  try {
  const places = await prisma.place.findMany({
      where: { teamId: { in: filterTeamIds } },
      select: {
        id: true,
        teamId: true,
        name: true,
        description: true,
        city: true,
        country: true,
        currency: true,
        totalEarnings: true,
        placeTypeId: true,
        createdAt: true,
        isActive: true,
        team: {
          select: {
            ownerId: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

  const shaped = places.map((p) => ({
      id: p.id,
      teamId: p.teamId,
      name: p.name,
      description: p.description,
      city: p.city,
      country: p.country,
      currency: p.currency,
      totalEarnings: p.totalEarnings,
      placeTypeId: p.placeTypeId,
      createdAt: p.createdAt,
      isActive: p.isActive,
      teamPeopleCount: (p.team?._count.members ?? 0) + 1, // owner + members
    }));

    return NextResponse.json(shaped);
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    console.error('GET /api/places failed', err);
    // audit only on error to reduce noise
    await logAudit({
      action: 'places.list',
      status: 'ERROR',
      actor: session,
      message: 'Failed to list places',
      metadata: { code: err?.code || null, message: typeof err?.message === 'string' ? err.message : null } as Prisma.InputJsonValue,
    });
    const message = typeof err?.message === 'string' ? err.message : 'Server error';
    const code = err?.code || undefined;
    return NextResponse.json(
      { error: 'Server error', detail: process.env.NODE_ENV !== 'production' ? { message, code } : undefined },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'place.create',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    teamId?: string;
    placeTypeId?: string | null;
    description?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    country?: string | null;
    timezone?: string | null;
    currency?: string | null;
    isActive?: boolean;
  };

  const name = (body.name || '').trim();
  if (!name) {
    await logAudit({
      action: 'place.create',
      status: 'ERROR',
      message: 'Missing name',
      actor: session,
    });
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Resolve teamId: either validate the provided one or auto-detect if user belongs to exactly one team.
  let targetTeamId: string | undefined = undefined;
  if (typeof body.teamId === 'string' && body.teamId) {
    const ok = await prisma.team.findFirst({
      where: {
        id: body.teamId,
        OR: [
          { ownerId: session.userId },
          { members: { some: { userId: session.userId } } },
        ],
      },
      select: { id: true },
    });
    if (!ok) {
      await logAudit({
        action: 'place.create',
        status: 'DENIED',
        message: 'Forbidden teamId',
        actor: session,
        metadata: { teamId: body.teamId },
      });
      return NextResponse.json({ error: 'Forbidden teamId' }, { status: 403 });
    }
    targetTeamId = body.teamId;
  } else {
    const [owned, memberOf] = await Promise.all([
      prisma.team.findMany({
        where: { ownerId: session.userId },
        select: { id: true },
      }),
      prisma.teamMember.findMany({
        where: { userId: session.userId },
        select: { teamId: true },
      }),
    ]);
    const teamIds = Array.from(
      new Set<string>([
        ...owned.map((t) => t.id),
        ...memberOf.map((t) => t.teamId),
      ]),
    );
    if (teamIds.length === 0) {
      await logAudit({
        action: 'place.create',
        status: 'ERROR',
        message: 'Requester not in any team',
        actor: session,
      });
      return NextResponse.json(
        { error: 'You are not in any team' },
        { status: 400 },
      );
    }
    if (teamIds.length > 1) {
      await logAudit({
        action: 'place.create',
        status: 'ERROR',
        message: 'Multiple teams; provide teamId',
        actor: session,
        metadata: { teamIds },
      });
      return NextResponse.json(
        { error: 'Multiple teams found; provide teamId' },
        { status: 400 },
      );
    }
    targetTeamId = teamIds[0];
  }

  try {
    const created = await prisma.place.create({
      data: {
        teamId: targetTeamId!,
        name,
        placeTypeId: body.placeTypeId ?? null,
        description: body.description ?? null,
        address1: body.address1 ?? null,
        address2: body.address2 ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        timezone: body.timezone ?? null,
        currency: body.currency ?? undefined,
        isActive: body.isActive ?? true,
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        description: true,
        city: true,
        country: true,
        currency: true,
        totalEarnings: true,
        placeTypeId: true,
        createdAt: true,
      },
    });
    await logAudit({
      action: 'place.create',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      target: { table: 'Place', id: created.id },
      metadata: { name },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      await logAudit({
        action: 'place.create',
        status: 'ERROR',
        actor: session,
        teamId: targetTeamId!,
        message: 'Duplicate name',
        metadata: { name },
      });
      return NextResponse.json(
        { error: 'Place name already exists in your team' },
        { status: 409 },
      );
    }
    console.error(e);
    await logAudit({
      action: 'place.create',
      status: 'ERROR',
      actor: session,
      teamId: targetTeamId!,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
