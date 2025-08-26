import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const placeIdParam = searchParams.get('placeId');
  const q = (searchParams.get('q') || '').trim();
  const onlyActiveParam = searchParams.get('onlyActive');
  const onlyActive = onlyActiveParam === 'true' ? true : onlyActiveParam === 'false' ? false : undefined;

  // Resolve teams current user belongs to
  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({ where: { ownerId: session.userId }, select: { id: true } }),
    prisma.teamMember.findMany({ where: { userId: session.userId }, select: { teamId: true } }),
  ]);
  const myTeamIds = Array.from(new Set<number>([
    ...owned.map((t) => t.id),
    ...memberOf.map((t) => t.teamId),
  ]));
  if (myTeamIds.length === 0) return NextResponse.json([]);

  // Optional filter by team
  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    const tid = Number(teamIdParam);
    if (!Number.isInteger(tid)) return NextResponse.json({ error: 'Invalid teamId' }, { status: 400 });
    if (!myTeamIds.includes(tid)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [tid];
  }

  // Optional filter by place (validate it belongs to allowed team)
  let filterPlaceId: number | undefined;
  if (placeIdParam) {
    const pid = Number(placeIdParam);
    if (!Number.isInteger(pid)) return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });
    const place = await prisma.place.findFirst({ where: { id: pid, teamId: { in: filterTeamIds } }, select: { id: true } });
    if (!place) return NextResponse.json({ error: 'Forbidden placeId' }, { status: 403 });
    filterPlaceId = pid;
  }

  const items = await prisma.item.findMany({
    where: {
      ...(filterPlaceId ? { placeId: filterPlaceId } : {}),
      place: { teamId: { in: filterTeamIds } },
      ...(onlyActive === undefined ? {} : { isActive: onlyActive }),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      placeId: true,
      name: true,
      sku: true,
      categoryId: true,
      price: true,
      taxRateBps: true,
      isActive: true,
      createdAt: true,
      place: { select: { name: true, currency: true, teamId: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const shaped = items.map((it) => ({
    id: it.id,
    placeId: it.placeId,
    name: it.name,
    sku: it.sku,
    categoryId: it.categoryId,
    categoryName: it.category?.name ?? null,
    price: it.price,
    taxRateBps: it.taxRateBps,
    isActive: it.isActive,
    createdAt: it.createdAt,
    placeName: it.place?.name ?? '—',
    currency: it.place?.currency ?? 'EUR',
    teamId: it.place?.teamId ?? null,
  }));

  return NextResponse.json(shaped);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({ action: 'item.create', status: 'DENIED', message: 'Unauthorized' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    placeId?: number;
    name?: string;
    sku?: string | null;
    categoryId?: number | null;
    price?: number;
    taxRateBps?: number;
    isActive?: boolean;
  };

  const name = (body.name || '').trim();
  const placeId = Number(body.placeId);
  const price = Number(body.price);
  const taxRateBps = body.taxRateBps ?? 0;

  if (!name)
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!Number.isInteger(placeId) || placeId <= 0)
    return NextResponse.json({ error: 'Valid placeId is required' }, { status: 400 });
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0)
    return NextResponse.json({ error: 'Invalid taxRateBps' }, { status: 400 });

  // Get place and ensure access
  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { id: true, teamId: true, isActive: true } });
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

  // Validate category if provided: must be global (teamId null) or belong to the same team
  let categoryId: number | null = body.categoryId ?? null;
  if (categoryId != null) {
    if (!Number.isInteger(categoryId) || categoryId <= 0)
      return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
    const okCat = await prisma.itemCategory.findFirst({
      where: { id: categoryId, OR: [{ teamId: null }, { teamId: place.teamId }] },
      select: { id: true },
    });
    if (!okCat)
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
  }

  try {
    const created = await prisma.item.create({
      data: {
        placeId: place.id,
        name,
        sku: body.sku ?? null,
        categoryId,
        price,
        taxRateBps,
        isActive: body.isActive ?? true,
      },
      select: {
        id: true,
        placeId: true,
        name: true,
        sku: true,
        categoryId: true,
        price: true,
        taxRateBps: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      action: 'item.create',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Item', id: created.id },
      metadata: { name, placeId: place.id },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      // Unique constraint failed (name or sku unique per place)
      return NextResponse.json({ error: 'Duplicate name or SKU for this place' }, { status: 409 });
    }
    console.error(e);
    await logAudit({ action: 'item.create', status: 'ERROR', actor: session, teamId: place.teamId, message: 'Server error' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
