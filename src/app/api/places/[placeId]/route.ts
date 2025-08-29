import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

// GET /api/places/[placeId] -> single place details
export async function GET(
  _req: Request,
  context: RouteContext<'/api/places/[placeId]'>,
) {
  const { placeId: placeIdParam } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const place = await prisma.place.findUnique({
    where: { id: placeId },
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
        select: { ownerId: true, _count: { select: { members: true } } },
      },
    },
  });
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // permission: user must own or be member of the place's team
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

  const shaped = {
    id: place.id,
    teamId: place.teamId,
    name: place.name,
    description: place.description,
    city: place.city,
    country: place.country,
    currency: place.currency,
    totalEarnings: place.totalEarnings,
    placeTypeId: place.placeTypeId,
    createdAt: place.createdAt,
    isActive: place.isActive,
    teamPeopleCount: (place.team?._count.members ?? 0) + 1,
  };

  return NextResponse.json(shaped);
}

// DELETE /api/places/[placeId] -> delete a place after confirmation
export async function DELETE(
  req: Request,
  context: RouteContext<'/api/places/[placeId]'>,
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { placeId: placeIdParam } = await context.params;
  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { confirmName?: string };
  const confirmName = (body.confirmName || '').trim();

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true, name: true, teamId: true },
  });
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // permission: owner or team admin can delete
  const team = await prisma.team.findUnique({
    where: { id: place.teamId },
    select: { ownerId: true, members: { select: { userId: true, role: true } } },
  });
  const isOwner = team?.ownerId === session.userId;
  const isAdmin = team?.members.some((m) => m.userId === session.userId && m.role === 'ADMIN');
  if (!isOwner && !isAdmin) {
    await logAudit({
      action: 'place.delete',
      status: 'DENIED',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Forbidden',
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!confirmName || confirmName !== place.name) {
    return NextResponse.json(
      { error: 'Confirmation name does not match' },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction([
      // Remove place-item relations
      prisma.placeItem.deleteMany({ where: { placeId: place.id } }),
      // Remove explicit place members
      prisma.placeMember.deleteMany({ where: { placeId: place.id } }),
      // Set receipts to no longer point to the place (keep history)
      prisma.receipt.updateMany({ where: { placeId: place.id }, data: { placeId: null } }),
      // Finally, delete the place
      prisma.place.delete({ where: { id: place.id } }),
    ]);

    await logAudit({
      action: 'place.delete',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      metadata: { name: place.name },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete place', e);
    await logAudit({
      action: 'place.delete',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Server error while deleting place',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
