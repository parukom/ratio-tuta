import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

// GET /api/places/[placeId] -> single place details
export async function GET(
  _: Request,
  { params }: { params: { placeId: string } },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = params.placeId;
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
