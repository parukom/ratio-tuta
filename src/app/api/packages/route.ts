import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

// GET /api/packages
// Returns all active packages
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { monthlyCents: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        monthlyCents: true,
        annualCents: true,
        features: true,
        isActive: true,
      },
    });

    return NextResponse.json(packages, { status: 200 });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
