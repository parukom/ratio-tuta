import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { Prisma } from '@/generated/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import type { MeasurementType } from '@/generated/prisma';
import { canCreateItem } from '@/lib/limits';
import { rateLimit, apiLimiter } from '@lib/rate-limit-redis';
import { validateRequestSize, validateFieldSizes, REQUEST_SIZE_LIMITS, FIELD_LIMITS } from '@lib/request-validator';
import { createSafeErrorResponse, getConstraintErrorMessage, isConstraintError } from '@lib/error-handler';

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
  const minPricePaidParam = searchParams.get('minPricePaid');
  const maxPricePaidParam = searchParams.get('maxPricePaid');
  const sortParam = (searchParams.get('sort') || '').toLowerCase();
  // Optional pagination
  const pageParam = searchParams.get('page');
  const perPageParam = searchParams.get('perPage');
  const hasPagination = !!(pageParam || perPageParam);
  const page = Math.max(1, Number.parseInt(pageParam || '1', 10) || 1);
  const perPageRaw = Number.parseInt(perPageParam || '25', 10) || 25;
  // cap perPage to 25 as requested
  const perPage = Math.max(1, Math.min(25, perPageRaw));

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
  type MT = 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
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
  ['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA'].includes(
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
    ...(() => {
      const gte =
        minPricePaidParam != null && minPricePaidParam !== ''
          ? Number(minPricePaidParam)
          : undefined;
      const lte =
        maxPricePaidParam != null && maxPricePaidParam !== ''
          ? Number(maxPricePaidParam)
          : undefined;
      const range: Prisma.FloatFilter = {};
      if (typeof gte === 'number' && Number.isFinite(gte)) range.gte = gte;
      if (typeof lte === 'number' && Number.isFinite(lte)) range.lte = lte;
      return range.gte !== undefined || range.lte !== undefined
        ? { pricePaid: range }
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
    // pricePaid sorting becomes available after prisma client regeneration
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

  const items = await prisma.item.findMany({
    where: whereClause,
    select: {
      id: true,
      teamId: true,
      name: true,
      sku: true,
      categoryId: true,
      price: true,
      pricePaid: true,
      taxRateBps: true,
      isActive: true,
      isUnlimited: true,
      stockQuantity: true,
      createdAt: true,
      measurementType: true,
      description: true,
      color: true,
      size: true,
      brand: true,
      tags: true,
      imageUrl: true,
      imageKey: true,
      category: { select: { name: true } },
    },
    orderBy,
    ...(hasPagination ? { skip: (page - 1) * perPage, take: perPage } : {}),
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
                : 'pcs';
    return {
      id: it.id,
      teamId: it.teamId,
      name: it.name,
      sku: it.sku,
      categoryId: it.categoryId,
      categoryName: it.category?.name ?? null,
      price: it.price,
      pricePaid: it.pricePaid ?? 0,
      taxRateBps: it.taxRateBps,
      isActive: it.isActive,
      isUnlimited: it.isUnlimited,
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
      imageUrl: it.imageUrl ?? null,
      currency: 'EUR',
    };
  });

  if (!hasPagination) {
    return NextResponse.json(shaped);
  }

  const total = await prisma.item.count({ where: whereClause });
  return NextResponse.json({ items: shaped, total, page, perPage });
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

  // SECURITY FIX: Request size validation
  const sizeValidation = validateRequestSize(req, REQUEST_SIZE_LIMITS.ITEM_CREATE);
  if (!sizeValidation.valid) {
    await logAudit({
      action: 'item.create',
      status: 'DENIED',
      message: 'Request too large',
      actor: session,
      metadata: { contentLength: sizeValidation.contentLength, limit: sizeValidation.limit },
    });
    return NextResponse.json(
      { error: sizeValidation.error },
      { status: 413 }
    );
  }

  // Rate limiting: 50 items per minute (skip in development)
  if (process.env.NODE_ENV !== 'development') {
    const rateLimitResult = await rateLimit(req, apiLimiter);
    if (!rateLimitResult.success) {
      await logAudit({
        action: 'item.create',
        status: 'DENIED',
        message: 'Rate limit exceeded',
        actor: session,
      });
      return NextResponse.json(
        { error: 'Too many item creations. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          }
        }
      );
    }
  }

  const body = (await req.json()) as {
    teamId?: string;
    name?: string;
    sku?: string | null;
    categoryId?: string | null;
    price?: number;
    pricePaid?: number;
    taxRateBps?: number;
    isActive?: boolean;
    isUnlimited?: boolean;
    stockQuantity?: number;
    measurementType?: string;
    unit?: string; // legacy alias
    description?: string | null;
    color?: string | null;
    size?: string | null;
    brand?: string | null;
    tags?: string[] | null;
    imageUrl?: string | null;
    imageKey?: string | null;
  };

  // SECURITY FIX: Validate field sizes
  const fieldValidation = validateFieldSizes(body as Record<string, unknown>, {
    name: FIELD_LIMITS.ITEM_NAME,
    description: FIELD_LIMITS.ITEM_DESCRIPTION,
    sku: FIELD_LIMITS.ITEM_SKU,
  });
  if (!fieldValidation.valid) {
    await logAudit({
      action: 'item.create',
      status: 'DENIED',
      message: 'Invalid field sizes',
      actor: session,
      metadata: { errors: fieldValidation.errors },
    });
    return NextResponse.json(
      { error: 'Validation failed', details: fieldValidation.errors },
      { status: 400 }
    );
  }

  const name = (body.name || '').trim();
  const price = Number(body.price);
  const pricePaid = Number(
    typeof body.pricePaid === 'number' ? body.pricePaid : 0,
  );
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
  const imageUrl = (body.imageUrl ?? '').trim() || null;
  const imageKey = (body.imageKey ?? '').trim() || null;

  if (!name)
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json(
      { error: 'Valid price is required' },
      { status: 400 },
    );
  if (!Number.isFinite(pricePaid) || pricePaid < 0)
    return NextResponse.json({ error: 'Invalid pricePaid' }, { status: 400 });
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
    // Enforce item limit before creation
    try {
      const limit = await canCreateItem(targetTeamId!)
      if (!limit.allowed) {
        await logAudit({
          action: 'item.create',
          status: 'DENIED',
          actor: session,
          teamId: targetTeamId!,
          message: 'Item limit reached',
          metadata: { current: limit.current, max: limit.max }
        })
        return NextResponse.json({ error: 'Item limit reached. Upgrade your plan.' }, { status: 403 })
      }
    } catch (e) {
      await logAudit({ action: 'item.limitCheck', status: 'ERROR', actor: session, teamId: targetTeamId!, message: `Failed to check item limit ${e}` })
      // Fail open
    }
    const created = await prisma.item.create({
      data: {
        teamId: targetTeamId!,
        name,
        sku: body.sku ?? null,
        categoryId,
        price,
        pricePaid,
        taxRateBps,
        isActive: body.isActive ?? true,
        isUnlimited: body.isUnlimited ?? false,
        stockQuantity,
        measurementType,
        description,
        color,
        size,
        brand,
        tags,
        imageUrl,
        imageKey,
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        sku: true,
        categoryId: true,
        price: true,
        pricePaid: true,
        taxRateBps: true,
        isActive: true,
        isUnlimited: true,
        stockQuantity: true,
        createdAt: true,
        measurementType: true,
        description: true,
        color: true,
        size: true,
        brand: true,
        tags: true,
        imageUrl: true,
        imageKey: true,
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
                : 'pcs';
    return NextResponse.json(
      { ...created, unit: createdUnit },
      { status: 201 },
    );
  } catch (e) {
    // SECURITY FIX: Use production-safe error messages
    if (isConstraintError(e)) {
      const message = getConstraintErrorMessage(e);
      await logAudit({
        action: 'item.create',
        status: 'ERROR',
        actor: session,
        teamId: targetTeamId!,
        message: `Constraint violation: ${message}`,
      });
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    // Generic server error with safe messaging
    return createSafeErrorResponse({
      error: e,
      action: 'item.create',
      session,
      teamId: targetTeamId!,
      developmentMessage: e instanceof Error ? e.message : 'Failed to create item',
      productionMessage: 'Unable to create item. Please try again later.',
    });
  }
}
