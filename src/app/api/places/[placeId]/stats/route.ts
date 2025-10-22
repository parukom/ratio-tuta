import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

// GET /api/places/[placeId]/stats -> get place statistics
export async function GET(
  _req: Request,
  context: RouteContext<'/api/places/[placeId]/stats'>,
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

    // Check permissions
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

    // Fetch statistics in parallel
    const [receipts, placeItems] = await Promise.all([
      // Get all receipts for this place
      prisma.receipt.findMany({
        where: { placeId },
        select: {
          id: true,
          paymentOption: true,
          items: {
            select: {
              itemId: true,
              quantity: true,
            },
          },
        },
      }),
      // Get active items in this place with their names
      prisma.placeItem.findMany({
        where: {
          placeId,
          quantity: { gt: 0 },
        },
        select: {
          item: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate statistics
    const returnedItems = receipts.filter(r => r.paymentOption === 'REFUND').length;

    // Items sold: count unique itemIds across all non-refund receipts
    const soldItemIds = new Set<string>();
    receipts
      .filter(r => r.paymentOption !== 'REFUND')
      .forEach(receipt => {
        receipt.items.forEach(item => {
          soldItemIds.add(item.itemId);
        });
      });
    const itemsSold = soldItemIds.size;

    // Active items: count unique catalog items (group by prefix before " - ")
    // This makes items with variations (e.g., "Shoes - 35", "Shoes - 36") count as 1
    const activeItemsCount = (() => {
      const prefixes = new Set<string>();
      for (const pi of placeItems) {
        const name = pi.item?.name ?? '';
        const prefix = name.split(' - ')[0];
        prefixes.add(prefix);
      }
      return prefixes.size;
    })();

    return NextResponse.json({
      returnedItems,
      itemsSold,
      activeItems: activeItemsCount,
    });
  } catch (e: unknown) {
    console.error('GET /api/places/[placeId]/stats failed', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
