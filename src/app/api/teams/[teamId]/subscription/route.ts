import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

// GET /api/teams/[teamId]/subscription
// Returns the active subscription for a team
export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { teamId } = await params;

  // Verify user has access to this team
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });

  if (!team) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get active subscription with package details
    const subscription = await prisma.teamSubscription.findFirst({
      where: {
        teamId,
        isActive: true,
      },
      include: {
        package: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            monthlyCents: true,
            annualCents: true,
            features: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      // No active subscription means they're on the free plan
      const freePackage = await prisma.package.findUnique({
        where: { slug: 'free' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          monthlyCents: true,
          annualCents: true,
          features: true,
        },
      });

      return NextResponse.json({
        subscription: null,
        package: freePackage,
        isActive: true,
        isFree: true,
      });
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        isAnnual: subscription.isAnnual,
        priceCents: subscription.priceCents,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
      },
      package: subscription.package,
      isActive: subscription.isActive,
      isFree: false,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
