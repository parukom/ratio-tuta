import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

type PostBody = {
  placeId?: string;
  items?: Array<{ itemId?: string; quantity?: number }>;
  amountGiven?: number;
  paymentOption?: 'CASH' | 'CARD' | 'REFUND';
};

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId') || undefined;

  // resolve accessible teamIds for the user
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

  // optional constrain by placeId
  let filterPlaceId: string | undefined;
  if (placeId) {
    const place = await prisma.place.findFirst({
      where: { id: placeId, teamId: { in: myTeamIds } },
      select: { id: true },
    });
    if (!place)
      return NextResponse.json({ error: 'Forbidden placeId' }, { status: 403 });
    filterPlaceId = placeId;
  }

  const receipts = await prisma.receipt.findMany({
    where: {
      ...(filterPlaceId ? { placeId: filterPlaceId } : {}),
      ...(myTeamIds.length > 0 ? { place: { teamId: { in: myTeamIds } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      placeId: true,
      totalPrice: true,
      amountGiven: true,
      change: true,
      paymentOption: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          itemId: true,
          title: true,
          price: true,
          quantity: true,
        },
      },
    },
    take: 50,
  });

  return NextResponse.json(receipts);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'receipt.create',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as PostBody;
  const placeId = body.placeId || '';
  const items = Array.isArray(body.items) ? body.items : [];
  const amountGiven = Number(body.amountGiven ?? 0);
  const paymentOption = body.paymentOption ?? 'CASH';

  if (!placeId)
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: 'items are required' }, { status: 400 });
  if (!Number.isFinite(amountGiven) || amountGiven < 0)
    return NextResponse.json({ error: 'Invalid amountGiven' }, { status: 400 });

  const place = await prisma.place.findUnique({
    select: { id: true, teamId: true, totalEarnings: true },
    where: { id: placeId },
  });
  if (!place)
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });

  // permission: user must belong to the team
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

  // Validate items and fetch current prices
  const itemIds = items
    .map((i) => i.itemId)
    .filter((id): id is string => typeof id === 'string' && !!id);
  if (itemIds.length !== items.length)
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const dbItems = await prisma.item.findMany({
    where: { id: { in: itemIds }, teamId: place.teamId },
    select: { id: true, name: true, price: true },
  });
  if (dbItems.length !== itemIds.length)
    return NextResponse.json(
      { error: 'Some items not found in team' },
      { status: 400 },
    );

  // Map and compute totals; also verify stock from PlaceItem if present
  const dbItemMap = new Map(dbItems.map((d) => [d.id, d] as const));
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || (it.quantity ?? 0) <= 0)
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  // Fetch current stock for the place for the involved items
  const stockRows = await prisma.placeItem.findMany({
    where: { placeId, itemId: { in: itemIds } },
    select: { itemId: true, quantity: true },
  });
  const stockMap = new Map(
    stockRows.map((r) => [r.itemId, r.quantity] as const),
  );
  for (const it of items) {
    const available = stockMap.get(it.itemId!) ?? 0;
    if (available < (it.quantity ?? 0)) {
      return NextResponse.json(
        { error: 'Insufficient stock', itemId: it.itemId, available },
        { status: 409 },
      );
    }
  }

  const receiptItemsData = items.map((it) => {
    const meta = dbItemMap.get(it.itemId!)!;
    return {
      itemId: it.itemId!,
      title: meta.name,
      price: meta.price,
      quantity: it.quantity!,
    };
  });
  const totalPrice = receiptItemsData.reduce(
    (sum, ri) => sum + ri.price * ri.quantity,
    0,
  );
  const change = amountGiven - totalPrice;
  if (change < 0)
    return NextResponse.json(
      { error: 'amountGiven is less than totalPrice', totalPrice },
      { status: 400 },
    );

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create receipt
      const receipt = await tx.receipt.create({
        data: {
          userId: session.userId,
          placeId,
          totalPrice,
          amountGiven,
          change,
          paymentOption,
          status: 'COMPLETED',
          items: { createMany: { data: receiptItemsData } },
        },
        select: { id: true },
      });

  // Decrement stock per item for the place, guarding against negatives
      for (const it of items) {
        const qty = it.quantity!;

        // 1) Place stock: ensure sufficient quantity atomically
        const placeUpd = await tx.placeItem.updateMany({
          where: {
            placeId,
            itemId: it.itemId!,
            quantity: { gte: qty },
          },
          data: { quantity: { decrement: qty } },
        });
        if (placeUpd.count !== 1) {
          throw new Error(`INSUFFICIENT_PLACE_STOCK:${it.itemId}`);
        }
      }

      // Update place earnings
      await tx.place.update({
        where: { id: placeId },
        data: { totalEarnings: { increment: totalPrice } },
      });

      return receipt.id;
    });

    await logAudit({
      action: 'receipt.create',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Receipt', id: result },
      metadata: { placeId, totalPrice, count: items.length },
    });

    return NextResponse.json(
      { id: result, totalPrice, change },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    const msg = (e as Error)?.message || '';
    if (msg.startsWith('INSUFFICIENT_PLACE_STOCK')) {
      const [, code] = msg.split(':');
      return NextResponse.json(
        { error: 'Insufficient stock', scope: 'place', itemId: code },
        { status: 409 },
      );
    }
    await logAudit({
      action: 'receipt.create',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
