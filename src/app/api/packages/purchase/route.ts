import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';

// POST /api/packages/purchase
// Body: { teamId: string, packageSlug: string, annual?: boolean }
// Creates a new TeamSubscription (deactivates previous active subscription)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const actor = session;

  const { teamId, packageSlug, annual } = (await req.json()) as {
    teamId: string;
    packageSlug: string;
    annual?: boolean;
  };
  if (!teamId || !packageSlug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Ensure actor belongs to the team (owner/admin)
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: actor.userId },
        { members: { some: { userId: actor.userId, role: { in: ['ADMIN', 'OWNER'] } } } },
      ],
    },
    select: { id: true, ownerId: true },
  });
  if (!team) {
    await logAudit({ action: 'package.purchase', status: 'DENIED', actor, teamId, message: 'Forbidden' });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pkg = await prisma.package.findUnique({ where: { slug: packageSlug } });
  if (!pkg || !pkg.isActive) {
    await logAudit({ action: 'package.purchase', status: 'ERROR', actor, teamId, message: 'Package not found', metadata: { packageSlug } });
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const priceCents = annual ? pkg.annualCents : pkg.monthlyCents;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // deactivate existing active subscriptions
      await tx.teamSubscription.updateMany({ where: { teamId, isActive: true }, data: { isActive: false } });

      const sub = await tx.teamSubscription.create({
        data: {
          teamId,
            packageId: pkg.id,
          isActive: true,
          isAnnual: !!annual,
          priceCents,
          metadata: { purchasedBy: actor.userId },
        },
        select: { id: true, teamId: true, packageId: true, isAnnual: true, priceCents: true, createdAt: true },
      });
      return sub;
    });

    await logAudit({ action: 'package.purchase', status: 'SUCCESS', actor, teamId, target: { table: 'TeamSubscription', id: result.id }, metadata: { packageSlug, annual: !!annual } });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error(e);
    await logAudit({ action: 'package.purchase', status: 'ERROR', actor, teamId, message: 'Server error', metadata: { packageSlug } });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
