import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import type { MeasurementType } from '@/generated/prisma';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const placeIdParam = searchParams.get('placeId');
  const q = (searchParams.get('q') || '').trim();
  const onlyActiveParam = searchParams.get('onlyActive');
  const onlyActive =
    onlyActiveParam === 'true'
      ? true
      : onlyActiveParam === 'false'
        ? false
        : undefined;

  // Resolve teams current user belongs to
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

  // Optional filter by team
  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    const tid = teamIdParam;
    if (!myTeamIds.includes(tid))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [tid];
  }

  // Optional filter by place: we now use the PlaceItem join table
  let filterPlaceId: string | undefined;
  if (placeIdParam) {
    const pid = placeIdParam;
    const place = await prisma.place.findFirst({
      where: { id: pid, teamId: { in: filterTeamIds } },
      select: { id: true },
    });
    if (!place)
      return NextResponse.json({ error: 'Forbidden placeId' }, { status: 403 });
    filterPlaceId = pid;
  }

  const items = await prisma.item.findMany({
    where: {
      teamId: { in: filterTeamIds },
      ...(filterPlaceId
        ? { places: { some: { placeId: filterPlaceId } } }
        : {}),
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
      teamId: true,
      name: true,
      sku: true,
      categoryId: true,
      price: true,
      taxRateBps: true,
      isActive: true,
      stockQuantity: true,
      createdAt: true,
      measurementType: true,
      description: true,
      color: true,
      size: true,
      brand: true,
      tags: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const shaped = items.map((it) => {
    const displayUnit =
      it.measurementType === 'PCS'
        ? 'pcs'
        : it.measurementType === 'WEIGHT'
          ? 'kg'
          : it.measurementType === 'LENGTH'
            ? 'm'
            : it.measurementType === 'VOLUME'
              ? 'l'
              : it.measurementType === 'AREA'
                ? 'm2'
                : it.measurementType === 'TIME'
                  ? 'h'
                  : 'pcs';
    return {
    id: it.id,
    teamId: it.teamId,
    name: it.name,
    sku: it.sku,
    categoryId: it.categoryId,
    categoryName: it.category?.name ?? null,
    price: it.price,
    taxRateBps: it.taxRateBps,
    isActive: it.isActive,
      // backward-compat display field
      unit: displayUnit,
      stockQuantity: it.stockQuantity,
    createdAt: it.createdAt,
    measurementType: it.measurementType,
    description: it.description ?? null,
    color: it.color ?? null,
    size: it.size ?? null,
    brand: it.brand ?? null,
    tags: it.tags ?? [],
    currency: 'EUR',
    };
  });

  return NextResponse.json(shaped);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'item.create',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    teamId?: string;
    name?: string;
    sku?: string | null;
    categoryId?: string | null;
    price?: number;
    taxRateBps?: number;
    isActive?: boolean;
    stockQuantity?: number;
    measurementType?: string;
  unit?: string; // legacy alias
    description?: string | null;
    color?: string | null;
    size?: string | null;
    brand?: string | null;
    tags?: string[] | null;
  };

  const name = (body.name || '').trim();
  const price = Number(body.price);
  const taxRateBps = body.taxRateBps ?? 0;
  const stockQuantity = Number(
    typeof body.stockQuantity === 'number' ? body.stockQuantity : 0,
  );
  // normalize measurement type with legacy unit mapping
  const fromUnit = (u: string): MeasurementType => {
    const m = u.trim().toLowerCase();
    const map: Record<string, MeasurementType> = {
      pcs: 'PCS', piece: 'PCS', pieces: 'PCS', unit: 'PCS', units: 'PCS',
      kg: 'WEIGHT', g: 'WEIGHT', gram: 'WEIGHT', grams: 'WEIGHT', kilo: 'WEIGHT',
      m: 'LENGTH', cm: 'LENGTH', mm: 'LENGTH', meter: 'LENGTH', metres: 'LENGTH',
      l: 'VOLUME', ml: 'VOLUME', litre: 'VOLUME', liters: 'VOLUME',
      m2: 'AREA', sqm: 'AREA', sq: 'AREA',
      h: 'TIME', hr: 'TIME', hour: 'TIME', hours: 'TIME', min: 'TIME', minute: 'TIME', s: 'TIME', sec: 'TIME', second: 'TIME',
    };
    return map[m] ?? 'PCS';
  };
  const measurementType = (
    (body.measurementType && body.measurementType.toUpperCase()) ||
    (typeof body.unit === 'string' ? fromUnit(body.unit) : 'PCS')
  ) as MeasurementType;
  const description = (body.description ?? '').trim() || null;
  const color = (body.color ?? '').trim() || null;
  const size = (body.size ?? '').trim() || null;
  const brand = (body.brand ?? '').trim() || null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  if (!name)
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json(
      { error: 'Valid price is required' },
      { status: 400 },
    );
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0)
    return NextResponse.json({ error: 'Invalid taxRateBps' }, { status: 400 });
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0)
    return NextResponse.json(
      { error: 'Invalid stockQuantity' },
      { status: 400 },
    );
  // Validate measurement type against enum values
  const validMeasurementTypes = new Set<MeasurementType>([
    'PCS',
    'WEIGHT',
    'LENGTH',
    'VOLUME',
    'AREA',
    'TIME',
  ]);
  if (!validMeasurementTypes.has(measurementType as MeasurementType)) {
    return NextResponse.json(
      { error: 'Invalid measurementType' },
      { status: 400 },
    );
  }

  // Resolve team: from provided teamId or infer if user belongs to exactly one
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
    if (!ok)
      return NextResponse.json({ error: 'Forbidden teamId' }, { status: 403 });
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
    const myTeams = Array.from(
      new Set<string>([
        ...owned.map((t) => t.id),
        ...memberOf.map((t) => t.teamId),
      ]),
    );
    if (myTeams.length === 0)
      return NextResponse.json(
        { error: 'You are not in any team' },
        { status: 400 },
      );
    if (myTeams.length > 1)
      return NextResponse.json(
        { error: 'Multiple teams found; provide teamId' },
        { status: 400 },
      );
    targetTeamId = myTeams[0];
  }

  // Validate category if provided: must be global (teamId null) or belong to the same team
  const categoryId: string | null = body.categoryId ?? null;
  if (categoryId != null) {
    const okCat = await prisma.itemCategory.findFirst({
      where: {
        id: categoryId,
        OR: [{ teamId: null }, { teamId: targetTeamId }],
      },
      select: { id: true },
    });
    if (!okCat)
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 },
      );
  }

  try {
  const created = await prisma.item.create({
      data: {
        teamId: targetTeamId!,
        name,
        sku: body.sku ?? null,
        categoryId,
        price,
        taxRateBps,
        isActive: body.isActive ?? true,
        stockQuantity,
    measurementType,
  description,
  color,
  size,
  brand,
  tags,
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        sku: true,
        categoryId: true,
        price: true,
        taxRateBps: true,
        isActive: true,
        stockQuantity: true,
        createdAt: true,
  measurementType: true,
  description: true,
  color: true,
  size: true,
  brand: true,
  tags: true,
      },
    });

    await logAudit({
      action: 'item.create',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      target: { table: 'Item', id: created.id },
      metadata: { name, teamId: targetTeamId },
    });

    const createdUnit =
      created.measurementType === 'PCS'
        ? 'pcs'
        : created.measurementType === 'WEIGHT'
          ? 'kg'
          : created.measurementType === 'LENGTH'
            ? 'm'
            : created.measurementType === 'VOLUME'
              ? 'l'
              : created.measurementType === 'AREA'
                ? 'm2'
                : created.measurementType === 'TIME'
                  ? 'h'
                  : 'pcs';
    return NextResponse.json({ ...created, unit: createdUnit }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      // Unique constraint failed (name or sku unique per team)
      return NextResponse.json(
        { error: 'Duplicate name or SKU for this team' },
        { status: 409 },
      );
    }
    console.error(e);
    await logAudit({
      action: 'item.create',
      status: 'ERROR',
      actor: session,
      teamId: targetTeamId!,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
