import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { Prisma } from '@/generated/prisma';
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
  const categoryIdParam = searchParams.get('categoryId');
  const measurementTypeParam = searchParams.get('measurementType');
  const inStockParam = searchParams.get('inStock');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const sortParam = (searchParams.get('sort') || '').toLowerCase();

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

  // Build filters
  type MT = 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
  const whereClause: Prisma.ItemWhereInput = {
    teamId: { in: filterTeamIds },
    ...(filterPlaceId ? { places: { some: { placeId: filterPlaceId } } } : {}),
    ...(onlyActive === undefined ? {} : { isActive: onlyActive }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(categoryIdParam ? { categoryId: categoryIdParam } : {}),
    ...(measurementTypeParam &&
    ['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA', 'TIME'].includes(
      measurementTypeParam.toUpperCase(),
    )
      ? { measurementType: measurementTypeParam.toUpperCase() as MT }
      : {}),
    ...(inStockParam === '1' || inStockParam === 'true'
      ? { stockQuantity: { gt: 0 } }
      : {}),
    ...(() => {
      const gte =
        minPriceParam != null && minPriceParam !== ''
          ? Number(minPriceParam)
          : undefined;
      const lte =
        maxPriceParam != null && maxPriceParam !== ''
          ? Number(maxPriceParam)
          : undefined;
      const priceRange: Prisma.FloatFilter = {};
      if (typeof gte === 'number' && Number.isFinite(gte)) priceRange.gte = gte;
      if (typeof lte === 'number' && Number.isFinite(lte)) priceRange.lte = lte;
      return priceRange.gte !== undefined || priceRange.lte !== undefined
        ? { price: priceRange }
        : {};
    })(),
  };

  // Build sorting
  let orderBy: Prisma.ItemOrderByWithRelationInput = { createdAt: 'desc' };
  switch (sortParam) {
    case 'createdat_asc':
      orderBy = { createdAt: 'asc' };
      break;
    case 'name_asc':
      orderBy = { name: 'asc' };
      break;
    case 'name_desc':
      orderBy = { name: 'desc' };
      break;
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'stock_asc':
      orderBy = { stockQuantity: 'asc' };
      break;
    case 'stock_desc':
      orderBy = { stockQuantity: 'desc' };
      break;
    case 'tax_asc':
      orderBy = { taxRateBps: 'asc' };
      break;
    case 'tax_desc':
      orderBy = { taxRateBps: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const itemSelect = Prisma.validator<Prisma.ItemSelect>()({
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
    attributes: true,
    itemTypeId: true,
    itemType: { select: { id: true, name: true } },
    category: { select: { name: true } },
  });
  type ItemWithRelations = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;
  const items: ItemWithRelations[] = await prisma.item.findMany({
    where: whereClause,
    select: itemSelect,
    orderBy,
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
      attributes:
        (it.attributes as unknown as Record<string, unknown> | null) ?? null,
      itemTypeId: it.itemTypeId ?? null,
      itemTypeName: it.itemType?.name ?? null,
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
    itemTypeId?: string | null;
    attributes?: unknown;
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
      pcs: 'PCS',
      piece: 'PCS',
      pieces: 'PCS',
      unit: 'PCS',
      units: 'PCS',
      kg: 'WEIGHT',
      g: 'WEIGHT',
      gram: 'WEIGHT',
      grams: 'WEIGHT',
      kilo: 'WEIGHT',
      m: 'LENGTH',
      cm: 'LENGTH',
      mm: 'LENGTH',
      meter: 'LENGTH',
      metres: 'LENGTH',
      l: 'VOLUME',
      ml: 'VOLUME',
      litre: 'VOLUME',
      liters: 'VOLUME',
      m2: 'AREA',
      sqm: 'AREA',
      sq: 'AREA',
      h: 'TIME',
      hr: 'TIME',
      hour: 'TIME',
      hours: 'TIME',
      min: 'TIME',
      minute: 'TIME',
      s: 'TIME',
      sec: 'TIME',
      second: 'TIME',
    };
    return map[m] ?? 'PCS';
  };
  const measurementType = ((body.measurementType &&
    body.measurementType.toUpperCase()) ||
    (typeof body.unit === 'string'
      ? fromUnit(body.unit)
      : 'PCS')) as MeasurementType;
  const description = (body.description ?? '').trim() || null;
  const color = (body.color ?? '').trim() || null;
  const size = (body.size ?? '').trim() || null;
  const brand = (body.brand ?? '').trim() || null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const itemTypeId =
    typeof body.itemTypeId === 'string' && body.itemTypeId
      ? body.itemTypeId
      : null;

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

  // Validate itemType and attributes if provided
  let attributes: Record<string, unknown> | null = null;
  if (itemTypeId) {
    const itemType = (await prisma.itemType.findFirst({
      where: { id: itemTypeId, teamId: targetTeamId },
      select: { id: true, fields: true },
    })) as { id: string; fields: unknown } | null;
    if (!itemType)
      return NextResponse.json(
        { error: 'itemTypeId not found' },
        { status: 400 },
      );
    attributes = (await (async () => {
      const fields = Array.isArray(itemType.fields as unknown)
        ? (itemType.fields as Array<{
            key: string;
            type: string;
            required?: boolean;
            options?: string[];
          }>)
        : [];
      const map = (body.attributes ?? {}) as Record<string, unknown>;
      if (typeof map !== 'object' || map === null || Array.isArray(map))
        return NextResponse.json(
          { error: 'attributes must be an object' },
          { status: 400 },
        );
      const out: Record<string, unknown> = {};
      for (const f of fields) {
        const key = String(f.key ?? '').trim();
        const type = String(f.type ?? '').toLowerCase();
        const required = Boolean(f.required ?? false);
        const has = Object.prototype.hasOwnProperty.call(map, key);
        const val = (map as Record<string, unknown>)[key];
        if (!has) {
          if (required)
            return NextResponse.json(
              { error: `Missing required attribute: ${key}` },
              { status: 400 },
            );
          continue;
        }
        if (val == null) {
          if (required)
            return NextResponse.json(
              { error: `Missing required attribute: ${key}` },
              { status: 400 },
            );
          continue;
        }
        switch (type) {
          case 'text':
            if (typeof val !== 'string')
              return NextResponse.json(
                { error: `Attribute ${key} must be string` },
                { status: 400 },
              );
            out[key] = String(val);
            break;
          case 'number':
            if (typeof val !== 'number' || !Number.isFinite(val))
              return NextResponse.json(
                { error: `Attribute ${key} must be number` },
                { status: 400 },
              );
            out[key] = Number(val);
            break;
          case 'boolean':
            if (typeof val !== 'boolean')
              return NextResponse.json(
                { error: `Attribute ${key} must be boolean` },
                { status: 400 },
              );
            out[key] = Boolean(val);
            break;
          case 'select': {
            const opts = Array.isArray(f.options)
              ? f.options.map((o) => String(o))
              : [];
            if (typeof val !== 'string' || !opts.includes(val))
              return NextResponse.json(
                {
                  error: `Attribute ${key} must be one of: ${opts.join(', ')}`,
                },
                { status: 400 },
              );
            out[key] = String(val);
            break;
          }
          default:
            return NextResponse.json(
              { error: `Unsupported attribute type for ${key}` },
              { status: 400 },
            );
        }
      }
      return out;
    })()) as unknown as Record<string, unknown> | null;
    if (attributes instanceof NextResponse) return attributes;
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
        itemTypeId,
        attributes: attributes
          ? (attributes as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
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
        attributes: true,
        itemTypeId: true,
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
    return NextResponse.json(
      { ...created, unit: createdUnit },
      { status: 201 },
    );
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
