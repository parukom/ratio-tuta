import { NextResponse } from 'next/server';
import { getAggregatedUsage } from '@/lib/reports';

export async function GET() {
  try {
    const data = await getAggregatedUsage();
    if (!data) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(data);
  } catch (e) {
    console.error('aggregated usage error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
