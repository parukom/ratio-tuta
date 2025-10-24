import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { deleteObjectByKey } from '@lib/s3';
import type { Prisma } from '@/generated/prisma';
import { requireCsrfToken } from '@lib/csrf';

// GET /api/items/[itemId] -> single item details
export async function GET(
  _req: Request,
  context: RouteContext<'/api/items/[itemId]'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  // SECURITY FIX: Find teams user belongs to FIRST
  const [ownedTeams, memberTeams] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: session.userId },
      select: { id: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: session.userId },
      select: { teamId: true },
    }),
  ]);

  const userTeamIds = [
    ...ownedTeams.map((t) => t.id),
    ...memberTeams.map((m) => m.teamId),
  ];

  if (userTeamIds.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch item ONLY if it belongs to user's teams (prevents enumeration)
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      teamId: { in: userTeamIds }, // Only fetch if user has access
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
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
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

  // Single error response - no information disclosure
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const unit =
    item.measurementType === 'PCS'
      ? 'pcs'
      : item.measurementType === 'WEIGHT'
        ? 'kg'
        : item.measurementType === 'LENGTH'
          ? 'm'
          : item.measurementType === 'VOLUME'
            ? 'l'
            : item.measurementType === 'AREA'
              ? 'm2'
              : 'pcs';
  return NextResponse.json({ ...item, unit });
}

// PATCH /api/items/[itemId] -> update mutable fields
export async function PATCH(
  req: Request,
  context: RouteContext<'/api/items/[itemId]'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: CSRF protection for item updates
  try {
    requireCsrfToken(req, session);
  } catch {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true, imageKey: true },
  });
  if (!existing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await prisma.team.findFirst({
    where: {
      id: existing.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json()) as Partial<{
    name: string;
    sku: string | null;
    categoryId: string | null;
    price: number;
    pricePaid: number;
    taxRateBps: number;
    isActive: boolean;
    stockQuantity: number;
    measurementType: string;
    description: string | null;
    color: string | null;
    size: string | null;
    brand: string | null;
    tags: string[] | null;
    unit: string; // legacy alias; will attempt to map to measurementType
    imageUrl: string | null;
    imageKey: string | null;
  }>;

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const v = body.name.trim();
    if (!v)
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    data.name = v;
  }
  if ('sku' in body) {
    data.sku = body.sku ?? null;
  }
  if ('categoryId' in body) {
    if (body.categoryId === null) data.categoryId = null;
    else if (typeof body.categoryId === 'string')
      data.categoryId = body.categoryId;
  }
  if ('price' in body) {
    const v = Number(body.price);
    if (!Number.isFinite(v) || v < 0)
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    data.price = v;
  }
  if ('pricePaid' in body) {
    const v = Number(body.pricePaid);
    if (!Number.isFinite(v) || v < 0)
      return NextResponse.json({ error: 'Invalid pricePaid' }, { status: 400 });
    (data as { pricePaid?: number }).pricePaid = v;
  }
  if ('taxRateBps' in body) {
    const v = Number(body.taxRateBps);
    if (!Number.isInteger(v) || v < 0)
      return NextResponse.json(
        { error: 'Invalid taxRateBps' },
        { status: 400 },
      );
    data.taxRateBps = v;
  }
  if ('isActive' in body) {
    data.isActive = Boolean(body.isActive);
  }
  // measurementType update (preferred)
  if ('measurementType' in body && typeof body.measurementType === 'string') {
    const v = body.measurementType.toUpperCase();
    const valid = new Set(['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA']);
    if (!valid.has(v))
      return NextResponse.json(
        { error: 'Invalid measurementType' },
        { status: 400 },
      );
    (
      data as {
        measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
      }
    ).measurementType = v as 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
  }
  // legacy 'unit' to measurementType mapping
  if ('unit' in body && typeof body.unit === 'string') {
    const u = body.unit.trim().toLowerCase();
    const map: Record<string, 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA'> =
      {
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
    const mt = map[u];
    if (mt)
      (
        data as {
          measurementType?: 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA';
        }
      ).measurementType = mt;
  }
  if ('stockQuantity' in body) {
    const v = Number(body.stockQuantity);
    if (!Number.isInteger(v) || v < 0)
      return NextResponse.json(
        { error: 'Invalid stockQuantity' },
        { status: 400 },
      );
    data.stockQuantity = v;
  }
  if ('description' in body) data.description = body.description ?? null;
  if ('color' in body) data.color = (body.color ?? null) as string | null;
  if ('size' in body) data.size = (body.size ?? null) as string | null;
  if ('brand' in body) data.brand = (body.brand ?? null) as string | null;
  if ('tags' in body) {
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean)
      : [];
    (data as { tags?: string[] }).tags = tags;
  }
  if ('imageUrl' in body)
    data.imageUrl = (body.imageUrl ?? null) as string | null;
  if ('imageKey' in body)
    data.imageKey = (body.imageKey ?? null) as string | null;

  // validate category if set
  if (data.categoryId) {
    const okCat = await prisma.itemCategory.findFirst({
      where: {
        id: data.categoryId as string,
        OR: [{ teamId: null }, { teamId: existing.teamId }],
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
    const updated = await prisma.item.update({
      where: { id: itemId },
      data,
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
        stockQuantity: true,
        createdAt: true,
        updatedAt: true,
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
      action: 'item.update',
      status: 'SUCCESS',
      actor: session,
      teamId: existing.teamId,
      target: { table: 'Item', id: updated.id },
      metadata: data as Prisma.InputJsonValue,
    });

    const unit =
      updated.measurementType === 'PCS'
        ? 'pcs'
        : updated.measurementType === 'WEIGHT'
          ? 'kg'
          : updated.measurementType === 'LENGTH'
            ? 'm'
            : updated.measurementType === 'VOLUME'
              ? 'l'
              : updated.measurementType === 'AREA'
                ? 'm2'
                : 'pcs';
    return NextResponse.json({ ...updated, unit });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate name or SKU for this team' },
        { status: 409 },
      );
    }
    console.error(e);
    await logAudit({
      action: 'item.update',
      status: 'ERROR',
      actor: session,
      teamId: existing.teamId,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/items/[itemId]
export async function DELETE(
  _req: Request,
  context: RouteContext<'/api/items/[itemId]'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: CSRF protection for item deletion
  try {
    requireCsrfToken(_req, session);
  } catch {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true, imageKey: true },
  });
  if (!existing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await prisma.team.findFirst({
    where: {
      id: existing.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // If there are dependent PlaceItem rows, deleting the item will fail unless
    // cascade rules exist. We can either soft-delete (isActive=false) or try delete.
    // Here, we perform a hard delete; client should handle 409 on FK constraints if any.

    // Preflight: if the item is assigned to any place, deny before touching S3
    const placeDeps = await prisma.placeItem.count({ where: { itemId } });
    if (placeDeps > 0) {
      await logAudit({
        action: 'item.delete',
        status: 'DENIED',
        actor: session,
        teamId: existing.teamId,
        message: 'Item is used in places',
      });
      return NextResponse.json(
        { error: 'Item is used in places. Remove it from places first.' },
        { status: 409 },
      );
    }

    // Best-effort: if this item's imageKey is not referenced by other items,
    // delete the S3 object BEFORE removing the DB row (as requested).
    if (existing.imageKey) {
      const others = await prisma.item.count({
        where: { imageKey: existing.imageKey, NOT: { id: itemId } },
      });
      if (others === 0) {
        try {
          await deleteObjectByKey(existing.imageKey);
        } catch (e) {
          console.warn(
            'Failed to delete S3 object for item before DB delete',
            e,
          );
        }
      }
    }

    const deleted = await prisma.item.delete({
      where: { id: itemId },
      select: { id: true },
    });

    await logAudit({
      action: 'item.delete',
      status: 'SUCCESS',
      actor: session,
      teamId: existing.teamId,
      target: { table: 'Item', id: deleted.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'P2003') {
      // Foreign key constraint failed — item is used in one or more places
      await logAudit({
        action: 'item.delete',
        status: 'DENIED',
        actor: session,
        teamId: existing.teamId,
        message: 'Item is used in places',
      });
      return NextResponse.json(
        { error: 'Item is used in places. Remove it from places first.' },
        { status: 409 },
      );
    }
    console.error(e);
    await logAudit({
      action: 'item.delete',
      status: 'ERROR',
      actor: session,
      teamId: existing.teamId,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
