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

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required?: boolean;
  unit?: string | null;
  options?: string[];
};

function validateFields(
  input: unknown,
): { ok: true; fields: FieldDef[] } | { ok: false; error: string } {
  if (!Array.isArray(input))
    return { ok: false, error: 'fields must be an array' };
  const keys = new Set<string>();
  const fields: FieldDef[] = [];
  for (const raw of input) {
    const r = raw as Record<string, unknown>;
    const label = String(r.label ?? '').trim();
    let key = String(r.key ?? '');
    if (!label) return { ok: false, error: 'Each field must have a label' };
    // derive key if not provided
    if (!key) key = slugify(label).replace(/-/g, '_');
    key = key.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key))
      return { ok: false, error: `Invalid field key: ${key}` };
    if (keys.has(key))
      return { ok: false, error: `Duplicate field key: ${key}` };
    keys.add(key);
    const type = String(r.type ?? '').toLowerCase();
    if (!['text', 'number', 'select', 'boolean'].includes(type))
      return { ok: false, error: `Invalid field type: ${type}` };
    const required = Boolean(r.required ?? false);
    const unit =
      r.unit == null || String(r.unit).trim() === '' ? null : String(r.unit);
    let options: string[] | undefined;
    if (type === 'select') {
      if (!Array.isArray(r.options) || (r.options as unknown[]).length === 0)
        return { ok: false, error: 'Select field must have non-empty options' };
      options = (r.options as unknown[])
        .map((o) => String(o).trim())
        .filter(Boolean);
      if (options.length === 0)
        return { ok: false, error: 'Select field must have non-empty options' };
    }
    fields.push({
      key,
      label,
      type: type as FieldDef['type'],
      required,
      unit,
      ...(options ? { options } : {}),
    });
  }
  return { ok: true, fields };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamIdParam = searchParams.get('teamId');
  const placeTypeId = searchParams.get('placeTypeId');
  const onlyActiveParam = searchParams.get('onlyActive');
  const onlyActive =
    onlyActiveParam === 'true'
      ? true
      : onlyActiveParam === 'false'
        ? false
        : undefined;

  // resolve my teams
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

  let filterTeamIds = myTeamIds;
  if (teamIdParam) {
    if (!myTeamIds.includes(teamIdParam))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    filterTeamIds = [teamIdParam];
  }

  const types = await prisma.itemType.findMany({
    where: {
      teamId: { in: filterTeamIds },
      ...(placeTypeId ? { placeTypeId } : {}),
      ...(onlyActive === undefined ? {} : { isActive: onlyActive }),
    },
    select: {
      id: true,
      teamId: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      placeTypeId: true,
      fields: true,
      createdAt: true,
    },
    orderBy: [{ name: 'asc' }],
  });

  return NextResponse.json(types);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'itemType.create',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    teamId?: string;
    name?: string;
    description?: string | null;
    placeTypeId?: string | null;
    fields?: unknown;
  };
  const name = String(body.name ?? '').trim();
  const description = (body.description ?? '').trim() || null;
  const placeTypeId = body.placeTypeId || null;
  if (!name)
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const v = validateFields(body.fields);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const fields = v.fields;

  // resolve team
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

  if (placeTypeId) {
    const okPT = await prisma.placeType.findFirst({
      where: {
        id: placeTypeId,
        OR: [{ teamId: null }, { teamId: targetTeamId }],
      },
      select: { id: true },
    });
    if (!okPT)
      return NextResponse.json(
        { error: 'placeTypeId not found' },
        { status: 400 },
      );
  }

  const base = slugify(name) || 'item-type';
  let slug = base;
  let n = 1;
  while (true) {
    const exists = await prisma.itemType.findFirst({
      where: { slug, teamId: targetTeamId! },
    });
    if (!exists) break;
    n += 1;
    slug = `${base}-${n}`;
  }

  try {
    const created = await prisma.itemType.create({
      data: {
        teamId: targetTeamId!,
        name,
        slug,
        description,
        placeTypeId,
        fields,
        isActive: true,
      },
      select: {
        id: true,
        teamId: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        placeTypeId: true,
        fields: true,
        createdAt: true,
      },
    });

    await logAudit({
      action: 'itemType.create',
      status: 'SUCCESS',
      actor: session,
      teamId: targetTeamId!,
      target: { table: 'ItemType', id: created.id },
      metadata: { name, slug },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'itemType.create',
      status: 'ERROR',
      actor: session,
      teamId: targetTeamId!,
      message: 'Server error',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
