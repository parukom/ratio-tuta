import { NextResponse } from 'next/server'
import { getSession } from '@lib/session'
import { prisma } from '@lib/prisma'
import { canAddTeamMember } from '@/lib/limits'

// GET /api/teams/[teamId]/limits/members
// Next.js App Router route handlers accept (request: Request, context: { params: ... }) but
// providing a strict inline type for the context can trip validation in newer versions.
// Use an untyped context and extract params safely.
export async function GET(req: Request) {
  // Extract teamId from pathname: /api/teams/:teamId/limits/members
  let teamId: string | undefined
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/') // ['', 'api','teams',':teamId','limits','members']
    const idx = parts.indexOf('teams')
    if (idx !== -1 && parts.length > idx + 1) {
      teamId = parts[idx + 1]
    }
  } catch {}
  if (!teamId) return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // verify requester is part of the team (owner or member)
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  })
  if (!team) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const result = await canAddTeamMember(teamId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
