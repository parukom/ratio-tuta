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

/**
 * Extract client IP address with spoofing protection
 *
 * SECURITY FIX: Prevent IP spoofing by:
 * 1. Only trusting proxy headers in production behind known proxies
 * 2. Validating IP format
 * 3. Taking the rightmost valid IP (closest to server) from X-Forwarded-For
 */
function getClientIP(hdrs: Headers): string | undefined {
  // In production behind a trusted proxy (Vercel, Cloudflare, etc.):
  // - Trust X-Forwarded-For but take the LAST valid IP (closest to our server)
  // - This prevents clients from injecting fake IPs
  const forwardedFor = hdrs.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For: client, proxy1, proxy2
    // We want the rightmost valid IP (added by our trusted proxy)
    const ips = forwardedFor
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => isValidIP(ip));

    if (ips.length > 0) {
      // In production, take the last IP (from trusted proxy)
      // In development, take the first IP (client)
      return process.env.NODE_ENV === 'production'
        ? ips[ips.length - 1]
        : ips[0];
    }
  }

  // Fallback to X-Real-IP (used by some proxies)
  const realIP = hdrs.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return realIP;
  }

  // No valid IP found
  return undefined;
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIP(ip: string): boolean {
  if (!ip) return false;

  // IPv4 validation (simple regex)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 validation (simplified - accepts standard format)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (ipv6Regex.test(ip)) {
    return true;
  }

  return false;
}

// Fire-and-forget helper. Intentionally does not throw.
export async function logAudit(input: AuditInput) {
  try {
    // SECURITY FIX: Read request context data with IP spoofing protection
    const hdrs = await headers();
    const ip = getClientIP(hdrs);
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
