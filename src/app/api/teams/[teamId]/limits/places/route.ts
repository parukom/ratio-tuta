import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { getSession } from '@lib/session'
import { canCreatePlace } from '@/lib/limits'

// GET /api/teams/:teamId/limits/places
export async function GET(_req: Request, { params }: { params: { teamId: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const teamId = params.teamId
  // verify membership
  const team = await prisma.team.findFirst({ where: { id: teamId, OR: [ { ownerId: session.userId }, { members: { some: { userId: session.userId } } } ] }, select: { id: true } })
  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res = await canCreatePlace(teamId)
  return NextResponse.json({ allowed: res.allowed, remaining: res.remaining, max: res.max, current: res.current })
}
