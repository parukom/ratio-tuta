import { headers } from 'next/headers';
import { prisma } from '@lib/prisma';
import type { AuditStatus, Prisma } from '@/generated/prisma';
import type { SessionData } from '@lib/session';

export type AuditInput = {
  action: string;
  status: AuditStatus;
  message?: string;
  actor?: SessionData | null;
  teamId?: string | null;
  target?: { table?: string; id?: string | number };
  metadata?: Prisma.InputJsonValue;
};

// Fire-and-forget helper. Intentionally does not throw.
export async function logAudit(input: AuditInput) {
  try {
    // Read request context data if available
    const hdrs = await headers();
    const ip =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      hdrs.get('x-real-ip') ||
      undefined;
    const userAgent = hdrs.get('user-agent') || undefined;

    await prisma.auditLog.create({
      data: {
        action: input.action,
        status: input.status,
        message: input.message,
        actorUserId: input.actor?.userId ?? null,
        teamId: input.teamId ?? null,
        targetTable: input.target?.table,
        targetId:
          typeof input.target?.id === 'number'
            ? input.target?.id
            : Number.isFinite(Number(input.target?.id))
            ? Number(input.target?.id)
            : null,
        ip,
        userAgent,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (e) {
    console.warn('[audit] failed to write log', e);
  }
}
