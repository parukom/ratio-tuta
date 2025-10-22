/**
 * Centralized Authorization System
 *
 * Prevents authorization bypass vulnerabilities by providing
 * a single source of truth for permission checks.
 */

import { prisma } from '@lib/prisma';
import type { SessionData } from '@lib/session';

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface TeamMembership {
  teamId: string;
  userId: string;
  role: TeamRole;
  isOwner: boolean;
}

/**
 * Get user's role in a specific team
 */
export async function getUserTeamRole(
  userId: string,
  teamId: string
): Promise<TeamMembership | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { userId },
        select: { userId: true, role: true },
      },
    },
  });

  if (!team) return null;

  const isOwner = team.ownerId === userId;
  const member = team.members[0];

  if (!member && !isOwner) return null;

  return {
    teamId: team.id,
    userId,
    role: member?.role ?? 'OWNER',
    isOwner,
  };
}

/**
 * Check if user is a member of the team (any role)
 */
export async function requireTeamMember(
  session: SessionData,
  teamId: string
): Promise<TeamMembership> {
  const membership = await getUserTeamRole(session.userId, teamId);

  if (!membership) {
    throw new AuthorizationError('User is not a member of this team', 'NOT_MEMBER');
  }

  return membership;
}

/**
 * Check if user is ADMIN or OWNER of the team
 */
export async function requireTeamAdmin(
  session: SessionData,
  teamId: string
): Promise<TeamMembership> {
  const membership = await requireTeamMember(session, teamId);

  if (membership.role === 'MEMBER') {
    throw new AuthorizationError('Admin or Owner role required', 'INSUFFICIENT_ROLE');
  }

  return membership;
}

/**
 * Check if user is OWNER of the team
 */
export async function requireTeamOwner(
  session: SessionData,
  teamId: string
): Promise<TeamMembership> {
  const membership = await requireTeamMember(session, teamId);

  if (!membership.isOwner) {
    throw new AuthorizationError('Owner role required', 'OWNER_ONLY');
  }

  return membership;
}

/**
 * Check if user can access a resource owned by a team
 */
export async function requireResourceAccess<T extends { teamId: string }>(
  session: SessionData,
  resource: T | null,
  resourceName: string
): Promise<{ resource: T; membership: TeamMembership }> {
  if (!resource) {
    throw new AuthorizationError(`${resourceName} not found`, 'NOT_FOUND');
  }

  const membership = await requireTeamMember(session, resource.teamId);

  return { resource, membership };
}

/**
 * Validate role assignment permissions
 * Only OWNER can assign OWNER/ADMIN roles
 */
export function validateRoleAssignment(
  assignerRole: TeamRole,
  assignerIsOwner: boolean,
  targetRole: TeamRole
): void {
  // Only owner can assign OWNER or ADMIN roles
  if (['OWNER', 'ADMIN'].includes(targetRole) && !assignerIsOwner) {
    throw new AuthorizationError(
      'Only team owners can assign OWNER or ADMIN roles',
      'OWNER_REQUIRED_FOR_ROLE'
    );
  }

  // Cannot assign OWNER role through API (must be done via ownership transfer)
  if (targetRole === 'OWNER') {
    throw new AuthorizationError(
      'Cannot assign OWNER role. Use ownership transfer instead.',
      'OWNER_ASSIGNMENT_FORBIDDEN'
    );
  }
}

/**
 * Check if adding a team member would exceed subscription limits
 */
export async function checkTeamMemberLimit(teamId: string): Promise<void> {
  const subscription = await prisma.teamSubscription.findFirst({
    where: { teamId, isActive: true },
    include: { package: true },
  });

  const currentCount = await prisma.teamMember.count({
    where: { teamId },
  });

  // TypeScript fix: metadata is Prisma.JsonValue, need type guard
  const metadata = subscription?.package?.metadata;
  const maxMembers =
    metadata &&
    typeof metadata === 'object' &&
    !Array.isArray(metadata) &&
    'maxMembers' in metadata &&
    typeof metadata.maxMembers === 'number'
      ? metadata.maxMembers
      : undefined;

  if (maxMembers && currentCount >= maxMembers) {
    throw new AuthorizationError(
      `Team member limit reached (${maxMembers}). Upgrade your subscription.`,
      'LIMIT_EXCEEDED'
    );
  }
}

/**
 * Custom authorization error
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Handle authorization errors in API routes
 */
export function handleAuthError(error: unknown): {
  error: string;
  code?: string;
  status: number;
} {
  if (error instanceof AuthorizationError) {
    return {
      error: error.message,
      code: error.code,
      status: error.statusCode,
    };
  }

  console.error('Unexpected authorization error:', error);
  return {
    error: 'Authorization check failed',
    status: 500,
  };
}
