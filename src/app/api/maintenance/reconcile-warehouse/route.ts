import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

type PostBody = {
  teamId?: string;
  confirm?: boolean; // when false or omitted, returns a dry-run preview
};

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as PostBody;
  const teamId = body.teamId;
  const confirm = Boolean(body.confirm);

  if (!teamId || typeof teamId !== 'string')
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 });

  // Permission: owner or member of the team
  const allowed = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Group allocations by item
  const grouped = await prisma.placeItem.groupBy({
    by: ['itemId'],
    where: { item: { teamId } },
    _sum: { quantity: true },
  });

  // Load items in team
  const items = await prisma.item.findMany({
    where: { teamId },
    select: { id: true, name: true, stockQuantity: true },
  });

  const allocMap = new Map(grouped.map((g) => [g.itemId, g._sum.quantity ?? 0] as const));

  const plan = items.map((it) => {
    const allocated = allocMap.get(it.id) ?? 0;
    const newStock = Math.max(0, it.stockQuantity - allocated);
    return {
      itemId: it.id,
      name: it.name,
      current: it.stockQuantity,
      allocated,
      newStock,
      delta: newStock - it.stockQuantity,
    };
  }).filter((p) => p.delta !== 0);

  if (!confirm) {
    return NextResponse.json({ dryRun: true, count: plan.length, changes: plan.slice(0, 100) });
  }

  // Apply updates transactionally
  await prisma.$transaction(
    plan.map((p) =>
      prisma.item.update({ where: { id: p.itemId }, data: { stockQuantity: p.newStock } }),
    ),
  );

  return NextResponse.json({ dryRun: false, updated: plan.length });
}
