import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the user's team (owner or member)
    const [ownedTeam, memberTeam] = await Promise.all([
      prisma.team.findFirst({
        where: { ownerId: session.userId },
        select: {
          id: true,
          name: true,
          totalEarningsCash: true,
          totalEarningsCard: true,
          totalEarningsAll: true,
        },
      }),
      prisma.teamMember.findFirst({
        where: { userId: session.userId },
        select: {
          team: {
            select: {
              id: true,
              name: true,
              totalEarningsCash: true,
              totalEarningsCard: true,
              totalEarningsAll: true,
            },
          },
        },
      }),
    ]);

    const team = ownedTeam || memberTeam?.team;

    if (!team) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teamName: team.name,
      totalEarningsCash: team.totalEarningsCash,
      totalEarningsCard: team.totalEarningsCard,
      totalEarningsAll: team.totalEarningsAll,
    });
  } catch (error) {
    console.error('Failed to fetch team earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
