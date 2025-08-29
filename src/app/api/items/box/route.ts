import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

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
  const taxRateBps = Number(body.taxRateBps ?? 0);
  // Determine measurement type with legacy unit mapping
  type MT = 'PCS' | 'WEIGHT' | 'LENGTH' | 'VOLUME' | 'AREA' | 'TIME';
  const mtRaw = (body.measurementType || '').toString().toUpperCase();
  const validMT = new Set<MT>(['PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA', 'TIME']);
  let measurementType: MT = 'PCS';
  if (validMT.has(mtRaw as MT)) measurementType = mtRaw as MT;
  else if (typeof body.unit === 'string') {
    const u = body.unit.trim().toLowerCase();
    const map: Record<string, MT> = {
      pcs: 'PCS', piece: 'PCS', pieces: 'PCS', unit: 'PCS', units: 'PCS',
      kg: 'WEIGHT', g: 'WEIGHT', gram: 'WEIGHT', grams: 'WEIGHT', kilo: 'WEIGHT',
      m: 'LENGTH', cm: 'LENGTH', mm: 'LENGTH', meter: 'LENGTH',
      l: 'VOLUME', ml: 'VOLUME', litre: 'VOLUME',
      m2: 'AREA', sqm: 'AREA',
      h: 'TIME', hr: 'TIME', hour: 'TIME', min: 'TIME', minute: 'TIME', s: 'TIME', sec: 'TIME',
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
      for (const spec of sizes) {
        const sizeStr = String(spec.size).trim();
        const qty = Number(spec.quantity);
        const name = makeName(sizeStr);
        const sku = makeSku(sizeStr, spec.sku ?? null);

        // Try find by name within team
        const existing = await tx.item.findFirst({
          where: { teamId: targetTeamId!, name },
          select: { id: true, stockQuantity: true },
        });

        if (existing) {
          const updated = await tx.item.update({
            where: { id: existing.id },
            data: { stockQuantity: existing.stockQuantity + qty },
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
      taxRateBps,
  measurementType,
      count: sizes.length,
      totalAdded: results.reduce((a, r) => a + r.delta, 0),
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
