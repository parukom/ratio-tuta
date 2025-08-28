import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

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

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      teamId: true,
      name: true,
      sku: true,
      categoryId: true,
      price: true,
      taxRateBps: true,
      isActive: true,
      unit: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
    },
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

  return NextResponse.json(item);
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

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true },
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
    taxRateBps: number;
    isActive: boolean;
    unit: string;
    stockQuantity: number;
  }>;

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    data.name = v;
  }
  if ('sku' in body) {
    data.sku = body.sku ?? null;
  }
  if ('categoryId' in body) {
    if (body.categoryId === null) data.categoryId = null;
    else if (typeof body.categoryId === 'string') data.categoryId = body.categoryId;
  }
  if ('price' in body) {
    const v = Number(body.price);
    if (!Number.isFinite(v) || v < 0)
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    data.price = v;
  }
  if ('taxRateBps' in body) {
    const v = Number(body.taxRateBps);
    if (!Number.isInteger(v) || v < 0)
      return NextResponse.json({ error: 'Invalid taxRateBps' }, { status: 400 });
    data.taxRateBps = v;
  }
  if ('isActive' in body) {
    data.isActive = Boolean(body.isActive);
  }
  if ('unit' in body) {
    const v = (body.unit ?? '').trim();
    if (!v) return NextResponse.json({ error: 'Invalid unit' }, { status: 400 });
    data.unit = v;
  }
  if ('stockQuantity' in body) {
    const v = Number(body.stockQuantity);
    if (!Number.isInteger(v) || v < 0)
      return NextResponse.json({ error: 'Invalid stockQuantity' }, { status: 400 });
    data.stockQuantity = v;
  }

  // validate category if set
  if (data.categoryId) {
    const okCat = await prisma.itemCategory.findFirst({
      where: { id: data.categoryId as string, OR: [{ teamId: null }, { teamId: existing.teamId }] },
      select: { id: true },
    });
    if (!okCat)
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
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
        taxRateBps: true,
        isActive: true,
        unit: true,
        stockQuantity: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit({
      action: 'item.update',
      status: 'SUCCESS',
      actor: session,
      teamId: existing.teamId,
      target: { table: 'Item', id: updated.id },
      metadata: data as any,
    });

    return NextResponse.json(updated);
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

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true },
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
