import { prisma } from '@lib/prisma'

// Derive numeric limits from package features list (simple parse based on wording)
export async function getTeamPlaceLimit(teamId: string): Promise<{ maxPlaces: number | null }> {
  // Find active subscription with package
  const sub = await prisma.teamSubscription.findFirst({
    where: { teamId, isActive: true },
    include: { package: true },
  })
  if (!sub?.package) return { maxPlaces: 1 } // default free fallback
  const pkg = sub.package
  // Try to parse feature like "Up to X place" or "Unlimited places"
  let max: number | null = null
  for (const f of pkg.features) {
    const lower = f.toLowerCase()
    if (lower.includes('unlimited places')) { max = null; break }
    const m = /up to (\d+) place/.exec(lower)
    if (m) { max = parseInt(m[1], 10); break }
  }
  if (max === null) return { maxPlaces: null }
  return { maxPlaces: max }
}

export async function canCreatePlace(teamId: string): Promise<{ allowed: boolean; remaining: number | null; max: number | null; current: number }> {
  const [{ maxPlaces }, count] = await Promise.all([
    getTeamPlaceLimit(teamId),
    prisma.place.count({ where: { teamId } }),
  ])
  if (maxPlaces == null) return { allowed: true, remaining: null, max: null, current: count }
  const remaining = maxPlaces - count
  return { allowed: remaining > 0, remaining, max: maxPlaces, current: count }
}

// === Team member limits ===
export async function getTeamMemberLimit(teamId: string): Promise<{ maxMembers: number | null }> {
  const sub = await prisma.teamSubscription.findFirst({
    where: { teamId, isActive: true },
    include: { package: true },
  })
  if (!sub?.package) return { maxMembers: 1 } // free fallback: 1 teammate (owner counts separately in business logic?)
  let max: number | null = null
  for (const f of sub.package.features) {
    const lower = f.toLowerCase()
    if (lower.includes('unlimited workers') || lower.includes('unlimited team') || lower.includes('unlimited teammates')) { max = null; break }
    // patterns like: Up to 4 team mates / Up to 25 workers
    const m = /up to (\d+) (team mate|teammate|team mates|workers?)/.exec(lower)
    if (m) { max = parseInt(m[1], 10); break }
  }
  if (max === null) return { maxMembers: null }
  return { maxMembers: max }
}

export async function canAddTeamMember(teamId: string): Promise<{ allowed: boolean; remaining: number | null; max: number | null; current: number }> {
  const [{ maxMembers }, count] = await Promise.all([
    getTeamMemberLimit(teamId),
    prisma.teamMember.count({ where: { teamId } }),
  ])
  if (maxMembers == null) return { allowed: true, remaining: null, max: null, current: count }
  const remaining = maxMembers - count
  return { allowed: remaining > 0, remaining, max: maxMembers, current: count }
}
