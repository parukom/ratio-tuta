import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { requireCsrfToken } from '@lib/csrf';

// GET /api/places/[placeId] -> single place details
export async function GET(
  _req: Request,
  context: RouteContext<'/api/places/[placeId]'>,
) {
  const { placeId: placeIdParam } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: {
      id: true,
      teamId: true,
      name: true,
      description: true,
      address1: true,
      address2: true,
      city: true,
      country: true,
      timezone: true,
      currency: true,
      totalEarnings: true,
      placeTypeId: true,
      createdAt: true,
      isActive: true,
      _count: { select: { members: true } },
    },
  });
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // permission: user must own or be member of the place's team
  const allowed = await prisma.team.findFirst({
    where: {
      id: place.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const shaped = {
    id: place.id,
    teamId: place.teamId,
    name: place.name,
    description: place.description,
    address1: place.address1,
    address2: place.address2,
    city: place.city,
    country: place.country,
    timezone: place.timezone,
    currency: place.currency,
    totalEarnings: place.totalEarnings,
    placeTypeId: place.placeTypeId,
    createdAt: place.createdAt,
    isActive: place.isActive,
    teamPeopleCount: place._count.members ?? 0,
  };

  return NextResponse.json(shaped);
}

// DELETE /api/places/[placeId] -> delete a place after confirmation
export async function DELETE(
  req: Request,
  context: RouteContext<'/api/places/[placeId]'>,
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: CSRF protection for place deletion
  try {
    requireCsrfToken(req, session);
  } catch {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const { placeId: placeIdParam } = await context.params;
  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { confirmName?: string; returnItems?: boolean };
  const confirmName = (body.confirmName || '').trim();
  const returnItems = body.returnItems ?? true; // Default to returning items

  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true, name: true, teamId: true },
  });
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // permission: owner or team admin can delete
  const team = await prisma.team.findUnique({
    where: { id: place.teamId },
    select: {
      ownerId: true,
      members: { select: { userId: true, role: true } },
    },
  });
  const isOwner = team?.ownerId === session.userId;
  const isAdmin = team?.members.some(
    (m) => m.userId === session.userId && m.role === 'ADMIN',
  );
  if (!isOwner && !isAdmin) {
    await logAudit({
      action: 'place.delete',
      status: 'DENIED',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Forbidden',
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!confirmName || confirmName !== place.name) {
    return NextResponse.json(
      { error: 'Confirmation name does not match' },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // STEP 1 & 2: Conditionally return items to team storage (warehouse)
      if (returnItems) {
        const placeItems = await tx.placeItem.findMany({
          where: { placeId: place.id },
          select: { itemId: true, quantity: true },
        });

        // Return quantities to team storage (Item.stockQuantity)
        for (const placeItem of placeItems) {
          await tx.item.update({
            where: { id: placeItem.itemId },
            data: { stockQuantity: { increment: placeItem.quantity } },
          });
        }
      }

      // STEP 3: Remove place-item relations
      await tx.placeItem.deleteMany({ where: { placeId: place.id } });

      // STEP 4: Remove explicit place members
      await tx.placeMember.deleteMany({ where: { placeId: place.id } });

      // STEP 5: Set receipts to no longer point to the place (keep history)
      await tx.receipt.updateMany({
        where: { placeId: place.id },
        data: { placeId: null },
      });

      // STEP 6: Finally, delete the place
      await tx.place.delete({ where: { id: place.id } });
    });

    await logAudit({
      action: 'place.delete',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      metadata: { name: place.name },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete place', e);
    await logAudit({
      action: 'place.delete',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Server error while deleting place',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/places/[placeId] -> update editable fields of a place
export async function PATCH(
  req: Request,
  context: RouteContext<'/api/places/[placeId]'>,
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // SECURITY: CSRF protection for place updates
  try {
    requireCsrfToken(req, session);
  } catch {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const { placeId: placeIdParam } = await context.params;
  const placeId = placeIdParam;
  if (!placeId || typeof placeId !== 'string')
    return NextResponse.json({ error: 'Invalid placeId' }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    description?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    country?: string | null;
    timezone?: string | null;
    currency?: string | null;
    isActive?: boolean;
  };

  // Load place and team for permission
  const place = await prisma.place.findUnique({
    where: { id: placeId },
    select: { id: true, teamId: true, name: true },
  });
  if (!place) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const team = await prisma.team.findUnique({
    where: { id: place.teamId },
    select: {
      ownerId: true,
      members: { select: { userId: true, role: true } },
    },
  });
  const isOwner = team?.ownerId === session.userId;
  const isAdmin = team?.members.some(
    (m) => m.userId === session.userId && m.role === 'ADMIN',
  );
  if (!isOwner && !isAdmin) {
    await logAudit({
      action: 'place.update',
      status: 'DENIED',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Forbidden',
    });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    data.name = name;
  }
  if ('description' in body) data.description = body.description ?? null;
  if ('address1' in body) data.address1 = body.address1 ?? null;
  if ('address2' in body) data.address2 = body.address2 ?? null;
  if ('city' in body) data.city = body.city ?? null;
  if ('country' in body) data.country = body.country ?? null;
  if ('timezone' in body) data.timezone = body.timezone ?? null;
  if ('currency' in body) data.currency = body.currency ?? null;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: 'No changes' }, { status: 400 });

  try {
    const updated = await prisma.place.update({
      where: { id: place.id },
      data,
      select: {
        id: true,
        teamId: true,
        name: true,
        description: true,
        address1: true,
        address2: true,
        city: true,
        country: true,
        timezone: true,
        currency: true,
        totalEarnings: true,
        placeTypeId: true,
        createdAt: true,
        isActive: true,
        _count: { select: { members: true } },
      },
    });

    await logAudit({
      action: 'place.update',
      status: 'SUCCESS',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      metadata: { fields: Object.keys(data) },
    });

    return NextResponse.json({
      id: updated.id,
      teamId: updated.teamId,
      name: updated.name,
      description: updated.description,
      address1: updated.address1,
      address2: updated.address2,
      city: updated.city,
      country: updated.country,
      timezone: updated.timezone,
      currency: updated.currency,
      totalEarnings: updated.totalEarnings,
      placeTypeId: updated.placeTypeId,
      createdAt: updated.createdAt,
      isActive: updated.isActive,
      teamPeopleCount: updated._count.members ?? 0,
    });
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Place name already exists in your team' },
        { status: 409 },
      );
    }
    console.error('Failed to update place', e);
    await logAudit({
      action: 'place.update',
      status: 'ERROR',
      actor: session,
      teamId: place.teamId,
      target: { table: 'Place', id: place.id },
      message: 'Server error while updating place',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
