import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

// GET /api/places/[placeId]/items -> list items assigned to a place with quantities
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

  const rows = await prisma.placeItem.findMany({
    where: { placeId },
    select: {
      id: true,
      placeId: true,
      itemId: true,
      quantity: true,
      item: {
        select: {
          id: true,
          teamId: true,
          name: true,
          sku: true,
          categoryId: true,
          price: true,
          taxRateBps: true,
          isActive: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const shaped = rows.map((r) => ({
    id: r.id,
    placeId: r.placeId,
    itemId: r.itemId,
    quantity: r.quantity,
    item: r.item,
  }));

  return NextResponse.json(shaped);
}

// POST /api/places/[placeId]/items -> upsert item quantity for the place
export async function POST(
  req: Request,
  { params }: { params: { placeId: string } },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = params.placeId;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const body = (await req.json()) as { itemId?: string; quantity?: number };
  const itemId = body.itemId as string | undefined;
  const quantity = Number(body.quantity);

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 0)
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });

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

  // Ensure the item belongs to the same team
  const item = await prisma.item.findFirst({
    where: { id: itemId, teamId: place.teamId },
    select: { id: true },
  });
  if (!item)
    return NextResponse.json(
      { error: 'Item not found in this team' },
      { status: 400 },
    );

  try {
    const upserted = await prisma.placeItem.upsert({
      where: { placeId_itemId: { placeId, itemId } },
      update: { quantity },
      create: { placeId, itemId, quantity },
      select: { id: true, placeId: true, itemId: true, quantity: true },
    });

    await logAudit({
      action: 'place.items.upsert',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'PlaceItem', id: upserted.id },
      metadata: { placeId, itemId, quantity },
    });

    return NextResponse.json(upserted, { status: 200 });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'place.items.upsert',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
