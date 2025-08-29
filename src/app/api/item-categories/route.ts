import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const onlyActiveParam = searchParams.get('onlyActive');
  const onlyActive =
    onlyActiveParam === 'true'
      ? true
      : onlyActiveParam === 'false'
        ? false
        : undefined;

  // Resolve teams current user belongs to
  const [owned, memberOf] = await Promise.all([
    prisma.team.findMany({ where: { ownerId: session.userId }, select: { id: true } }),
    prisma.teamMember.findMany({ where: { userId: session.userId }, select: { teamId: true } }),
  ]);
  const myTeamIds = Array.from(new Set<string>([...owned.map(t => t.id), ...memberOf.map(t => t.teamId)]));
  if (myTeamIds.length === 0) return NextResponse.json([]);

  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    if (!myTeamIds.includes(teamIdParam))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [teamIdParam];
  }

  const categories = await prisma.itemCategory.findMany({
    where: {
      OR: [{ teamId: null }, { teamId: { in: filterTeamIds } }],
      ...(onlyActive === undefined ? {} : { isActive: onlyActive }),
    },
    select: { id: true, teamId: true, name: true, slug: true, color: true, isActive: true, createdAt: true },
    orderBy: [{ teamId: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({ action: 'itemCategory.create', status: 'DENIED', message: 'Unauthorized' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { teamId?: string; name?: string; color?: string | null };
  const name = (body.name || '').trim();
  const color = (body.color ?? '').trim() || null;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  // Resolve team target (team-scoped category)
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
    if (!ok) return NextResponse.json({ error: 'Forbidden teamId' }, { status: 403 });
    targetTeamId = body.teamId;
  } else {
    const [owned, memberOf] = await Promise.all([
      prisma.team.findMany({ where: { ownerId: session.userId }, select: { id: true } }),
      prisma.teamMember.findMany({ where: { userId: session.userId }, select: { teamId: true } }),
    ]);
    const myTeamIds = Array.from(new Set<string>([...owned.map(t => t.id), ...memberOf.map(t => t.teamId)]));
    if (myTeamIds.length === 0)
      return NextResponse.json({ error: 'You are not in any team' }, { status: 400 });
    if (myTeamIds.length > 1)
      return NextResponse.json({ error: 'Multiple teams found; provide teamId' }, { status: 400 });
    targetTeamId = myTeamIds[0];
  }

  // Build unique slug within team
  const base = slugify(name) || 'category';
  let slug = base;
  let n = 1;
  // ensure unique with same (teamId, slug)
  while (true) {
    const exists = await prisma.itemCategory.findFirst({ where: { slug, teamId: targetTeamId } });
    if (!exists) break;
    n += 1;
    slug = `${base}-${n}`;
  }

  try {
    const created = await prisma.itemCategory.create({
      data: { teamId: targetTeamId!, name, slug, color, isActive: true },
      select: { id: true, teamId: true, name: true, slug: true, color: true, isActive: true, createdAt: true },
    });

    await logAudit({
      action: 'itemCategory.create',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      target: { table: 'ItemCategory', id: created.id },
      metadata: { name, slug, color },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 });
    }
    console.error(e);
    await logAudit({ action: 'itemCategory.create', status: 'ERROR', actor: session, teamId: targetTeamId!, message: 'Server error' });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
