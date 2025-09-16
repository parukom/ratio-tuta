import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { getSession } from '@lib/session'
import { canCreatePlace } from '@/lib/limits'

// GET /api/teams/:teamId/limits/places
export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let teamId: string | undefined
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const idx = parts.indexOf('teams')
    if (idx !== -1 && parts.length > idx + 1) teamId = parts[idx + 1]
  } catch {}
  if (!teamId) return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  // verify membership
  const team = await prisma.team.findFirst({ where: { id: teamId, OR: [ { ownerId: session.userId }, { members: { some: { userId: session.userId } } } ] }, select: { id: true } })
  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res = await canCreatePlace(teamId)
  return NextResponse.json({ allowed: res.allowed, remaining: res.remaining, max: res.max, current: res.current })
}
