import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';

export type UserActivityBreakdown = {
  labels: string[];
  series: number[];
};

// Aggregate some basic activity metrics for the current user
// Currently includes counts of receipts by status + audit logs (SUCCESS vs ERROR)
export async function getUserActivityBreakdown(): Promise<UserActivityBreakdown | null> {
  const session = await getSession();
  if (!session) return null;
  const userId = session.userId;

  // Parallel queries
  const [receiptAgg, auditAgg] = await Promise.all([
    prisma.receipt.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true }
    }).catch(() => []),
    prisma.auditLog.groupBy({
      by: ['status'],
      where: { actorUserId: userId },
      _count: { _all: true }
    }).catch(() => [])
  ]);

  const labels: string[] = [];
  const series: number[] = [];

  for (const r of receiptAgg) {
    labels.push(`Receipt ${r.status}`);
    series.push(r._count._all);
  }
  for (const a of auditAgg) {
    labels.push(`Audit ${a.status}`);
    series.push(a._count._all);
  }

  if (labels.length === 0) {
    return { labels: ['No Activity'], series: [0] };
  }
  return { labels, series };
}

export type TeamUsage = {
  teamId: string;
  teamName: string;
  members: number;
  membersLimit: number | null;
  places: number;
  placesLimit: number | null;
  items: number;
  itemsLimit: number | null;
  receipts30d: number;
  receipts30dLimit: number | null;
  packageName: string | null;
};

// Determine active team: prefer owned team else first membership
async function resolveActiveTeam(userId: string) {
  const owned = await prisma.team.findFirst({ where: { ownerId: userId } });
  if (owned) return owned;
  const membership = await prisma.teamMember.findFirst({ where: { userId }, include: { team: true } });
  return membership?.team || null;
}

export async function getTeamUsage(): Promise<TeamUsage | null> {
  const session = await getSession();
  if (!session) return null;
  const userId = session.userId;
  const team = await resolveActiveTeam(userId);
  if (!team) return null;

  // Active subscription (most recent active)
  const subscription = await prisma.teamSubscription.findFirst({
    where: { teamId: team.id, isActive: true },
    orderBy: { startedAt: 'desc' },
    include: { package: true }
  });

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [members, places, items, receipts30d] = await Promise.all([
    prisma.teamMember.count({ where: { teamId: team.id } }),
    prisma.place.count({ where: { teamId: team.id } }),
    prisma.item.count({ where: { teamId: team.id } }),
    prisma.receipt.count({ where: { place: { teamId: team.id }, timestamp: { gte: from } } })
  ]);

  // Determine limits (metadata based, safe parse)
  let membersLimit: number | null = subscription?.seats ?? null;
  let placesLimit: number | null = null;
  let itemsLimit: number | null = null;
  let receipts30dLimit: number | null = null;
  if (subscription?.package?.metadata) {
    type Meta = { maxPlaces?: number; maxItems?: number; maxReceipts30d?: number; seats?: number };
    const m = subscription.package.metadata as Meta;
    const anyMeta = m as Record<string, unknown>;
    const pickNumber = (...keys: string[]) => {
      for (const k of keys) {
        const v = anyMeta[k];
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10);
      }
      return null;
    };
    if (placesLimit == null) placesLimit = pickNumber('maxPlaces','placesLimit','places_limit','max_places');
    if (itemsLimit == null) itemsLimit = pickNumber('maxItems','itemsLimit','items_limit','max_items');
    if (receipts30dLimit == null) receipts30dLimit = pickNumber('maxReceipts30d','receipts30dLimit','receipts_limit','maxReceipts','max_receipts_30d');
    if (membersLimit == null) membersLimit = pickNumber('seats','membersLimit','maxMembers','max_members');
  }

  // Fallback: infer basic limits from package slug naming convention
  if (subscription?.package?.slug) {
    const slug = subscription.package.slug;
    // Structured mapping derived from seed features (metadata currently undefined)
    interface Limits { members: number | null; places: number | null; items: number | null; receipts: number | null; }
    const slugLimits: Record<string, Limits> = {
      free:        { members: 2,  places: 1,  items: 30,  receipts: 2000 },
      pro10:       { members: 5,  places: 2,  items: 120, receipts: 8000 }, // 4 team mates + owner = 5 total seats
      premium20:   { members: 26, places: 5,  items: 250, receipts: 20000 }, // 25 workers + owner = 26
      enterprise:  { members: null, places: null, items: null, receipts: null }, // unlimited
    };

    const limits = slugLimits[slug as keyof typeof slugLimits];
    if (limits) {
      if (membersLimit == null && limits.members != null) membersLimit = limits.members;
      if (placesLimit == null && limits.places != null) placesLimit = limits.places;
      if (itemsLimit == null && limits.items != null) itemsLimit = limits.items;
      if (receipts30dLimit == null && limits.receipts != null) receipts30dLimit = limits.receipts;
    } else if (slug.includes('free')) { // legacy heuristic fallback
      if (membersLimit == null) membersLimit = 2;
      if (placesLimit == null) placesLimit = 1;
      if (itemsLimit == null) itemsLimit = 30;
      if (receipts30dLimit == null) receipts30dLimit = 2000;
    }
  }

  return {
    teamId: team.id,
    teamName: team.name,
    members,
    membersLimit,
    places,
    placesLimit,
    items,
    itemsLimit,
    receipts30d,
    receipts30dLimit,
    packageName: subscription?.package?.name ?? null
  };
}

export type AggregatedUsage = {
  teamId: string | null;
  teamName: string | null;
  packageName: string | null;
  members: number; membersLimit: number | null;
  places: number; placesLimit: number | null;
  items: number; itemsLimit: number | null;
  receipts30d: number; receipts30dLimit: number | null;
  receiptCompleted: number;
  receiptRefunded: number;
  receiptCancelled: number;
  auditSuccess: number;
  auditError: number;
  auditDenied: number;
};

export async function getAggregatedUsage(): Promise<AggregatedUsage | null> {
  const session = await getSession();
  if (!session) return null;
  const userId = session.userId;

  const teamUsage = await getTeamUsage();

  // Raw counts by status for receipts (user) and audit logs
  type CountGroup<T extends string> = { status: T; _count: { _all: number } };
  type ReceiptStatus = 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  type AuditStatus = 'SUCCESS' | 'ERROR' | 'DENIED';
  const receiptStatusesPromise = prisma.receipt
    .groupBy({ by: ['status'], where: { userId }, _count: { _all: true } })
    .then(res => res as CountGroup<ReceiptStatus>[]) // constrain to expected subset
    .catch(() => [] as CountGroup<ReceiptStatus>[]);

  const auditStatusesPromise = prisma.auditLog
    .groupBy({ by: ['status'], where: { actorUserId: userId }, _count: { _all: true } })
    .then(res => res as CountGroup<AuditStatus>[])
    .catch(() => [] as CountGroup<AuditStatus>[]);

  const [receiptStatuses, auditStatuses] = await Promise.all([
    receiptStatusesPromise,
    auditStatusesPromise
  ]);

  function extract<T extends string>(list: CountGroup<T>[], key: T) {
    return list.find(r => r.status === key)?._count._all ?? 0;
  }

  return {
    teamId: teamUsage?.teamId ?? null,
    teamName: teamUsage?.teamName ?? null,
    packageName: teamUsage?.packageName ?? null,
    members: teamUsage?.members ?? 0,
    membersLimit: teamUsage?.membersLimit ?? null,
    places: teamUsage?.places ?? 0,
    placesLimit: teamUsage?.placesLimit ?? null,
    items: teamUsage?.items ?? 0,
    itemsLimit: teamUsage?.itemsLimit ?? null,
    receipts30d: teamUsage?.receipts30d ?? 0,
    receipts30dLimit: teamUsage?.receipts30dLimit ?? null,
    receiptCompleted: extract(receiptStatuses, 'COMPLETED'),
    receiptRefunded: extract(receiptStatuses, 'REFUNDED'),
    receiptCancelled: extract(receiptStatuses, 'CANCELLED'),
    auditSuccess: extract(auditStatuses, 'SUCCESS'),
    auditError: extract(auditStatuses, 'ERROR'),
    auditDenied: extract(auditStatuses, 'DENIED'),
  };
}
