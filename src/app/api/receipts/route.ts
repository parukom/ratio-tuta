import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { rateLimit, apiLimiter } from '@lib/rate-limit-redis';
import {
  validateRequestSize,
  validateFieldSizes,
  REQUEST_SIZE_LIMITS,
  FIELD_LIMITS,
} from '@lib/request-validator';
import { requireCsrfToken } from '@lib/csrf';

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
  const q = (searchParams.get('q') || '').trim();
  const limitParam = Number(searchParams.get('limit') || '25');
  const pageParam = Number(searchParams.get('page') || '1');
  const take = Number.isFinite(limitParam)
    ? Math.min(Math.max(1, limitParam), 100)
    : 25;
  const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1;
  const skip = (page - 1) * take;

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

  // Build search filter
  let where: Prisma.ReceiptWhereInput = {
    ...(filterPlaceId ? { placeId: filterPlaceId } : {}),
    ...(myTeamIds.length > 0 ? { place: { teamId: { in: myTeamIds } } } : {}),
  };

  if (q) {
    const qLower = q.toLowerCase();
    const byPayment = ['cash', 'card', 'refund'].includes(qLower)
      ? { paymentOption: qLower.toUpperCase() as 'CASH' | 'CARD' | 'REFUND' }
      : undefined;
    const qNum = Number(q);
    const byNumber: Prisma.ReceiptWhereInput | undefined = Number.isFinite(qNum)
      ? {
          OR: [{ totalPrice: qNum }, { amountGiven: qNum }, { change: qNum }],
        }
      : undefined;
    const byItem: Prisma.ReceiptWhereInput = {
      items: {
        some: {
          title: { contains: q, mode: 'insensitive' as Prisma.QueryMode },
        },
      },
    };

    const orClauses: Prisma.ReceiptWhereInput[] = [byItem];
    if (byPayment) orClauses.push(byPayment);
    if (byNumber) orClauses.push(byNumber);
    where = {
      AND: [where, { OR: orClauses }],
    };
  }

  const [total, receipts] = await Promise.all([
    prisma.receipt.count({ where }),
    prisma.receipt.findMany({
      where,
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
            measurementType: true,
          },
        },
      },
      skip,
      take,
    }),
  ]);

  return NextResponse.json({ data: receipts, total, page, limit: take });
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

  // SECURITY: CSRF protection for receipt creation
  try {
    requireCsrfToken(req, session);
  } catch {
    await logAudit({
      action: 'receipt.create',
      status: 'DENIED',
      message: 'Invalid CSRF token',
      actor: session,
    });
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  // SECURITY FIX: Request size validation (prevent DoS through large payloads)
  const sizeValidation = validateRequestSize(
    req,
    REQUEST_SIZE_LIMITS.RECEIPT_CREATE,
  );
  if (!sizeValidation.valid) {
    await logAudit({
      action: 'receipt.create',
      status: 'DENIED',
      message: 'Request too large',
      actor: session,
      metadata: {
        contentLength: sizeValidation.contentLength,
        limit: sizeValidation.limit,
      },
    });
    return NextResponse.json(
      { error: sizeValidation.error },
      { status: 413 }, // 413 Payload Too Large
    );
  }

  // Rate limiting: 30 receipts per minute per user (skip in development)
  if (process.env.NODE_ENV !== 'development') {
    const rateLimitResult = await rateLimit(req, apiLimiter);
    if (!rateLimitResult.success) {
      await logAudit({
        action: 'receipt.create',
        status: 'DENIED',
        message: 'Rate limit exceeded',
        actor: session,
      });
      return NextResponse.json(
        { error: 'Too many receipt creations. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
            ),
          },
        },
      );
    }
  }

  const body = (await req.json()) as PostBody;

  // SECURITY FIX: Validate field sizes (array length limits)
  const fieldValidation = validateFieldSizes(body as Record<string, unknown>, {
    items: FIELD_LIMITS.RECEIPT_ITEMS,
  });
  if (!fieldValidation.valid) {
    await logAudit({
      action: 'receipt.create',
      status: 'DENIED',
      message: 'Invalid field sizes',
      actor: session,
      metadata: { errors: fieldValidation.errors },
    });
    return NextResponse.json(
      { error: 'Validation failed', details: fieldValidation.errors },
      { status: 400 },
    );
  }
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
    select: { id: true, name: true, price: true, measurementType: true, isUnlimited: true },
  });
  if (dbItems.length !== itemIds.length)
    return NextResponse.json(
      { error: 'Some items not found in team' },
      { status: 400 },
    );

  // Map and compute totals
  const dbItemMap = new Map(dbItems.map((d) => [d.id, d] as const));
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || (it.quantity ?? 0) <= 0)
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  // SECURITY FIX: Removed pre-check (TOCTOU vulnerability)
  // Stock validation now happens atomically inside the transaction below

  const receiptItemsData = items.map((it) => {
    const meta = dbItemMap.get(it.itemId!)!;
    return {
      itemId: it.itemId!,
      title: meta.name,
      price: meta.price,
      // Store raw quantity as provided:
      // - WEIGHT: grams
      // - LENGTH: centimeters
      // - VOLUME: milliliters
      // - AREA: square centimeters
      // - PCS: integer units
      quantity: it.quantity!,
      measurementType: meta.measurementType,
    };
  });

  // Monetary rounding helper (cents)
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // Compute total considering measurement type:
  const totalPrice = round2(
    items.reduce((sum, it) => {
      const meta = dbItemMap.get(it.itemId!)!;
      const qty = it.quantity!;
      if (meta.measurementType === 'WEIGHT') {
        // price per kg, qty in grams -> convert to kg
        return sum + meta.price * (qty / 1000);
      }
      if (meta.measurementType === 'LENGTH') {
        // price per meter, qty in cm -> convert to meters
        return sum + meta.price * (qty / 100);
      }
      if (meta.measurementType === 'VOLUME') {
        // price per liter, qty in ml -> convert to liters
        return sum + meta.price * (qty / 1000);
      }
      if (meta.measurementType === 'AREA') {
        // price per m², qty in cm² -> convert to m²
        return sum + meta.price * (qty / 10000);
      }
      // PCS - price per unit, qty in units
      return sum + meta.price * qty;
    }, 0),
  );

  const given = round2(amountGiven);
  const change = round2(given - totalPrice);
  if (given < totalPrice)
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
          amountGiven: given,
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
        const meta = dbItemMap.get(it.itemId!)!;

        // Skip stock decrement for unlimited items
        if (meta.isUnlimited) {
          continue;
        }

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
