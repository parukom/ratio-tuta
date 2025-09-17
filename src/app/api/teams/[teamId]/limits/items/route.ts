import { NextResponse } from 'next/server'
import { prisma } from '@lib/prisma'
import { getSession } from '@lib/session'
import { canCreateItem } from '@/lib/limits'

// GET /api/teams/:teamId/limits/items
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

  const team = await prisma.team.findFirst({
    where: { id: teamId, OR: [ { ownerId: session.userId }, { members: { some: { userId: session.userId } } } ] },
    select: { id: true }
  })
  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const res = await canCreateItem(teamId)
    return NextResponse.json(res)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
