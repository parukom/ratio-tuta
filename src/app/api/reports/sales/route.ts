import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'week'; // 'week', 'month', 'year'
  const teamId = searchParams.get('teamId');

  // Get user's accessible teams
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

  if (myTeamIds.length === 0) {
    return NextResponse.json({
      totalRevenue: 0,
      totalSales: 0,
      averageOrderValue: 0,
      salesByDate: [],
      topPaymentMethod: 'CASH',
    });
  }

  // Filter by specific team if provided
  const filterTeamIds = teamId && myTeamIds.includes(teamId) ? [teamId] : myTeamIds;

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
  }

  // Fetch receipts within date range
  const receipts = await prisma.receipt.findMany({
    where: {
      place: {
        teamId: { in: filterTeamIds },
      },
      createdAt: {
        gte: startDate,
      },
      status: 'COMPLETED',
    },
    select: {
      id: true,
      totalPrice: true,
      paymentOption: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Calculate metrics
  const totalRevenue = receipts.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalSales = receipts.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Group by date
  const salesByDate: Record<string, { date: string; revenue: number; count: number }> = {};

  receipts.forEach((receipt) => {
    const dateKey = receipt.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!salesByDate[dateKey]) {
      salesByDate[dateKey] = {
        date: dateKey,
        revenue: 0,
        count: 0,
      };
    }
    salesByDate[dateKey].revenue += receipt.totalPrice;
    salesByDate[dateKey].count += 1;
  });

  // Convert to array and fill missing dates
  const salesArray = Object.values(salesByDate);

  // Count payment methods
  const paymentCounts: Record<string, number> = {
    CASH: 0,
    CARD: 0,
    REFUND: 0,
  };

  receipts.forEach((r) => {
    paymentCounts[r.paymentOption] = (paymentCounts[r.paymentOption] || 0) + 1;
  });

  const topPaymentMethod = Object.entries(paymentCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || 'CASH';

  return NextResponse.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalSales,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    salesByDate: salesArray,
    topPaymentMethod,
    paymentBreakdown: paymentCounts,
  });
}
