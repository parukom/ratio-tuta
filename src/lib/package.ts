import { prisma } from '@lib/prisma';

export async function getFreePackage() {
  return prisma.package.findUnique({ where: { slug: 'free' } });
}

export async function assignPackageToTeam(teamId: string, packageSlug: string, opts?: { annual?: boolean; actorUserId?: string }) {
  const pkg = await prisma.package.findUnique({ where: { slug: packageSlug } });
  if (!pkg || !pkg.isActive) throw new Error('Package not found');
  const priceCents = opts?.annual ? pkg.annualCents : pkg.monthlyCents;
  return prisma.$transaction(async (tx) => {
    await tx.teamSubscription.updateMany({ where: { teamId, isActive: true }, data: { isActive: false } });
    return tx.teamSubscription.create({
      data: {
        teamId,
        packageId: pkg.id,
        isActive: true,
        isAnnual: !!opts?.annual,
        priceCents,
        metadata: opts?.actorUserId ? { assignedBy: opts.actorUserId } : undefined,
      },
    });
  });
}
