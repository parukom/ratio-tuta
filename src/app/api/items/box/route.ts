import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import type { Prisma } from '@/generated/prisma';

type SizeSpec = { size: string; quantity: number; sku?: string | null };

// POST /api/items/box -> add a box of items (e.g., one color, many sizes) into team warehouse stock
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'item.box.add',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Partial<{
    teamId: string;
    baseName: string;
    color?: string | null;
    categoryId?: string | null;
    price: number;
    boxCost?: number; // total cost paid for the whole box
    taxRateBps?: number;
    measurementType?: string; // preferred
    unit?: string; // legacy alias
    skuPrefix?: string | null;
    sizes: SizeSpec[];
    createMissing?: boolean;
    isActive?: boolean;
    description?: string | null;
    brand?: string | null;
    tags?: string[] | null;
  }>;

  const baseName = String(body.baseName || '').trim();
  const color = (body.color ?? '').trim();
  const price = Number(body.price);
  const boxCost = Number(
    typeof body.boxCost === 'number' ? body.boxCost : 0,
  );
  const taxRateBps = Number(body.taxRateBps ?? 0);
  // Determine measurement type with legacy unit mapping
  type MT = 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
  const mtRaw = (body.measurementType || '').toString().toUpperCase();
  const validMT = new Set<MT>([
    'PCS',
    'WEIGHT',
    'LENGTH',
    'VOLUME',
    'AREA',
    'TIME',
  ]);
  let measurementType: MT = 'PCS';
  if (validMT.has(mtRaw as MT)) measurementType = mtRaw as MT;
  else if (typeof body.unit === 'string') {
    const u = body.unit.trim().toLowerCase();
    const map: Record<string, MT> = {
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
      l: 'VOLUME',
      ml: 'VOLUME',
      litre: 'VOLUME',
      m2: 'AREA',
      sqm: 'AREA',
      h: 'TIME',
      hr: 'TIME',
      hour: 'TIME',
      min: 'TIME',
      minute: 'TIME',
      s: 'TIME',
      sec: 'TIME',
    };
    measurementType = map[u] ?? 'PCS';
  }
  const skuPrefix = (body.skuPrefix ?? '').trim();
  const createMissing = body.createMissing !== false;
  const isActive = body.isActive !== false;
  const sizes = Array.isArray(body.sizes) ? body.sizes : [];
  const description = (body.description ?? '').trim() || null;
  const brand = (body.brand ?? '').trim() || null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  if (!baseName)
    return NextResponse.json(
      { error: 'baseName is required' },
      { status: 400 },
    );
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json(
      { error: 'Valid price is required' },
      { status: 400 },
    );
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0)
    return NextResponse.json({ error: 'Invalid taxRateBps' }, { status: 400 });
  if (sizes.length === 0)
    return NextResponse.json({ error: 'sizes is required' }, { status: 400 });
  if (!Number.isFinite(boxCost) || boxCost < 0)
    return NextResponse.json(
      { error: 'Invalid boxCost' },
      { status: 400 },
    );

  // Validate sizes entries
  for (const s of sizes) {
    const sizeStr = String(s?.size ?? '').trim();
    const qty = Number(s?.quantity);
    if (!sizeStr)
      return NextResponse.json(
        { error: 'Each size must have a size value' },
        { status: 400 },
      );
    if (!Number.isInteger(qty) || qty <= 0)
      return NextResponse.json(
        { error: `Invalid quantity for size ${sizeStr}` },
        { status: 400 },
      );
  }

  // Resolve team: from provided teamId or infer single team of user
  let targetTeamId: string | undefined;
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

  // Validate category if provided
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

  // helper to derive per-size item name and sku
  const colorSuffix = color ? ` (${color})` : '';
  const makeName = (size: string) => `${baseName}${colorSuffix} - ${size}`;
  const makeSku = (size: string, explicit?: string | null) =>
    (explicit && explicit.trim()) ||
    (skuPrefix ? `${skuPrefix}-${size}` : null);

  type ResultRow = {
    id: string;
    name: string;
    size: string;
    delta: number;
    created: boolean;
  };
  const results: ResultRow[] = [];

  try {
    const out = await prisma.$transaction(async (tx) => {
      // Determine total quantity across all size rows
      const totalQty = sizes.reduce((acc, s) => acc + Number(s.quantity || 0), 0);
      if (boxCost > 0 && totalQty <= 0) {
        throw new Error('boxCost provided but total quantity is zero');
      }
      const perUnitCost = totalQty > 0 && boxCost > 0 ? boxCost / totalQty : 0;
      for (const spec of sizes) {
        const sizeStr = String(spec.size).trim();
        const qty = Number(spec.quantity);
        const name = makeName(sizeStr);
        const sku = makeSku(sizeStr, spec.sku ?? null);

        // Try find by name within team
        const existing = await tx.item.findFirst({
          where: { teamId: targetTeamId!, name },
          select: { id: true, stockQuantity: true, pricePaid: true },
        });

        if (existing) {
          // Weighted-average pricePaid using current stock and new qty at perUnitCost
          const prevQty = existing.stockQuantity;
          const prevCost = existing.pricePaid ?? 0;
          const newQtyTotal = prevQty + qty;
          const newPricePaid =
            newQtyTotal > 0
              ? (prevCost * prevQty + perUnitCost * qty) / newQtyTotal
              : prevCost;

      const updated = await tx.item.update({
            where: { id: existing.id },
            data: {
              stockQuantity: existing.stockQuantity + qty,
              // Update pricePaid with weighted average by quantity
              pricePaid: { set: newPricePaid },
        // Also keep price/tax/measurementType in sync with the box settings
        price,
        taxRateBps,
        measurementType,
            },
            select: { id: true, name: true },
          });
          results.push({
            id: updated.id,
            name: updated.name,
            size: sizeStr,
            delta: qty,
            created: false,
          });
          continue;
        }

        if (!createMissing) {
          throw new Error(
            `Item not found for size ${sizeStr} and createMissing=false`,
          );
        }

        const created = await tx.item.create({
          data: {
            teamId: targetTeamId!,
            name,
            sku: sku ?? null,
            categoryId,
            price,
            pricePaid: perUnitCost,
            taxRateBps,
            isActive,
            measurementType,
            stockQuantity: qty,
            description,
            color: color || null,
            size: sizeStr,
            brand,
            tags,
          },
          select: { id: true, name: true },
        });
        results.push({
          id: created.id,
          name: created.name,
          size: sizeStr,
          delta: qty,
          created: true,
        });
      }

      return true;
    });
    if (!out) throw new Error('Transaction failed');
  } catch (e: unknown) {
    const msg =
      typeof (e as { message?: string })?.message === 'string'
        ? (e as { message: string }).message
        : 'Server error';
    await logAudit({
      action: 'item.box.add',
      status: 'ERROR',
      actor: session,
      teamId: targetTeamId!,
      message: msg,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await logAudit({
    action: 'item.box.add',
    status: 'SUCCESS',
    actor: session,
    teamId: targetTeamId!,
    metadata: {
      baseName,
      color: color || null,
      categoryId,
      price,
      boxCost,
      taxRateBps,
      measurementType,
      count: sizes.length,
      totalAdded: results.reduce((a, r) => a + r.delta, 0),
      perUnitCost:
        results.reduce((a, r) => a + r.delta, 0) > 0
          ? boxCost / results.reduce((a, r) => a + r.delta, 0)
          : 0,
    },
  });

  return NextResponse.json({
    ok: true,
    summary: {
      created: results.filter((r) => r.created).length,
      updated: results.filter((r) => !r.created).length,
      totalAdded: results.reduce((a, r) => a + r.delta, 0),
    },
    rows: results,
  });
}

// DELETE /api/items/box -> remove a whole box (baseName + color) from a team.
// This deletes all matching items after removing their PlaceItem assignments.
// Receipts remain intact because ReceiptItem stores denormalized item data and has no FK to Item.
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'item.box.delete',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<{
    teamId: string;
    baseName: string;
    color: string | null;
  }>;

  const baseName = String(body.baseName || '').trim();
  const colorRaw = body.color;
  const color = colorRaw == null ? null : String(colorRaw).trim();

  if (!baseName)
    return NextResponse.json(
      { error: 'baseName is required' },
      { status: 400 },
    );

  // Resolve team like in POST: either provided or infer single team for user
  let targetTeamId: string | undefined;
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

  // Build prefix pattern used by box creation: `${baseName}${color ? ` (${color})` : ''} - `
  const prefix = `${baseName}${color ? ` (${color})` : ''} - `;

  // Find all matching items by team, color, and name prefix
  const where: Prisma.ItemWhereInput = {
    teamId: targetTeamId!,
    name: { startsWith: prefix },
  };
  if (color === null) {
    where.OR = [{ color: null }, { color: '' }];
  } else {
    where.color = color;
  }

  const items = await prisma.item.findMany({
    where,
    select: { id: true },
  });

  if (items.length === 0) {
    return NextResponse.json({
      ok: true,
      deletedCount: 0,
      deletedIds: [],
      removedAssignments: 0,
    });
  }

  const itemIds = items.map((i) => i.id);

  try {
    let removedAssignments = 0;
    await prisma.$transaction(async (tx) => {
      const delPI = await tx.placeItem.deleteMany({
        where: { itemId: { in: itemIds } },
      });
      removedAssignments = delPI.count;
      await tx.item.deleteMany({ where: { id: { in: itemIds } } });
    });

    await logAudit({
      action: 'item.box.delete',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      metadata: {
        baseName,
        color: color ?? null,
        count: itemIds.length,
        removedAssignments,
      },
    });

    return NextResponse.json({
      ok: true,
      deletedCount: itemIds.length,
      deletedIds: itemIds,
      removedAssignments,
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'item.box.delete',
      status: 'ERROR',
      actor: session,
      teamId: targetTeamId!,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
