import { NextResponse } from 'next/server';
import { getUserActivityBreakdown } from '@/lib/reports';

export async function GET() {
  try {
    const data = await getUserActivityBreakdown();
    if (!data) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('user-activity error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
