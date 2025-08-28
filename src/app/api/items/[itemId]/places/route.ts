import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

// GET /api/items/[itemId]/places -> list places where the item is assigned
export async function GET(
  _req: Request,
  context: RouteContext<'/api/items/[itemId]/places'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // permission: user must be in the item's team
  const allowed = await prisma.team.findFirst({
    where: {
      id: item.teamId,
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
    where: { itemId },
    select: {
      place: { select: { id: true, name: true } },
      quantity: true,
    },
    orderBy: { placeId: 'asc' },
  });

  return NextResponse.json(
    rows.map((r) => ({ placeId: r.place.id, placeName: r.place.name, quantity: r.quantity })),
  );
}
