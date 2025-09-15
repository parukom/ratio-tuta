import { NextResponse } from 'next/server';
import { getTeamUsage } from '@/lib/reports';

export async function GET() {
  try {
    const data = await getTeamUsage();
    if (!data) return NextResponse.json({ error: 'Unauthorized or no team' }, { status: 401 });
    return NextResponse.json(data);
  } catch (e) {
    console.error('team-usage error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
