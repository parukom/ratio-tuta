/**
 * Error Handling and Sanitization for Production
 *
 * SECURITY FIX: Prevent information leakage through error messages in production
 *
 * Principles:
 * 1. Development: Detailed error messages for debugging
 * 2. Production: Generic error messages to prevent enumeration/disclosure
 * 3. Always log detailed errors server-side
 */

import { NextResponse } from 'next/server';
import { logAudit } from '@lib/logger';
import type { SessionData } from '@lib/session';

export interface SafeErrorOptions {
  error: unknown;
  action: string;
  status?: number;
  session?: SessionData | null;
  teamId?: string | null;
  developmentMessage?: string;
  productionMessage?: string;
}

/**
 * Create a safe error response that hides implementation details in production
 *
 * Usage:
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   return createSafeErrorResponse({
 *     error,
 *     action: 'item.create',
 *     session,
 *     teamId,
 *     developmentMessage: error.message, // Detailed in dev
 *     productionMessage: 'Unable to create item' // Generic in prod
 *   });
 * }
 * ```
 */
export async function createSafeErrorResponse(
  options: SafeErrorOptions
): Promise<NextResponse> {
  const {
    error,
    action,
    status = 500,
    session,
    teamId,
    developmentMessage,
    productionMessage = 'An error occurred. Please try again later.',
  } = options;

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Extract error details for logging
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log detailed error server-side
  await logAudit({
    action,
    status: 'ERROR',
    message: errorMessage,
    actor: session,
    teamId,
    metadata: {
      stack: errorStack,
      isDevelopment,
    },
  });

  // Also console.error for immediate visibility
  console.error(`[${action}] Error:`, error);

  // Return appropriate message based on environment
  const userMessage = isDevelopment
    ? developmentMessage || errorMessage
    : productionMessage;

  return NextResponse.json(
    {
      error: userMessage,
      ...(isDevelopment && { details: errorMessage, stack: errorStack }),
    },
    { status }
  );
}

/**
 * Sanitize error messages for production
 *
 * Returns generic message in production, detailed in development
 */
export function sanitizeErrorMessage(
  error: unknown,
  genericMessage: string = 'An error occurred'
): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error);
  }

  return genericMessage;
}

/**
 * Common production-safe error messages
 */
export const SAFE_ERROR_MESSAGES = {
  // Generic
  SERVER_ERROR: 'An error occurred. Please try again later.',
  INVALID_REQUEST: 'Invalid request. Please check your input.',

  // Authentication
  AUTH_FAILED: 'Authentication failed. Please try again.',
  SESSION_INVALID: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',

  // Resources
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  RESOURCE_CONFLICT: 'This operation conflicts with existing data.',

  // Validation
  VALIDATION_FAILED: 'Validation failed. Please check your input.',

  // Limits
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  SIZE_LIMIT_EXCEEDED: 'Request size exceeds the allowed limit.',

  // Operations
  CREATE_FAILED: 'Unable to create resource.',
  UPDATE_FAILED: 'Unable to update resource.',
  DELETE_FAILED: 'Unable to delete resource.',

  // Database
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
} as const;

/**
 * Check if error is a known database error (Prisma)
 */
export function isDatabaseError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const err = error as { code?: string; name?: string };

  // Prisma error codes
  if (err.code?.startsWith('P')) return true;

  // Prisma error names
  if (err.name?.includes('Prisma')) return true;

  return false;
}

/**
 * Check if error is a constraint violation (duplicate key, foreign key, etc.)
 */
export function isConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const err = error as { code?: string };

  // Prisma constraint error codes
  const constraintCodes = [
    'P2002', // Unique constraint
    'P2003', // Foreign key constraint
    'P2025', // Record not found
  ];

  return constraintCodes.includes(err.code || '');
}

/**
 * Get production-safe error for constraint violations
 */
export function getConstraintErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return SAFE_ERROR_MESSAGES.SERVER_ERROR;
  }

  const err = error as { code?: string; meta?: { target?: string[] } };

  const isDevelopment = process.env.NODE_ENV === 'development';

  switch (err.code) {
    case 'P2002': // Unique constraint
      if (isDevelopment) {
        const target = err.meta?.target?.join(', ') || 'unknown field';
        return `Duplicate value for: ${target}`;
      }
      return 'This value already exists. Please use a different value.';

    case 'P2003': // Foreign key constraint
      if (isDevelopment) {
        return `Foreign key constraint failed`;
      }
      return 'Related record not found.';

    case 'P2025': // Record not found
      return SAFE_ERROR_MESSAGES.RESOURCE_NOT_FOUND;

    default:
      return SAFE_ERROR_MESSAGES.DATABASE_ERROR;
  }
}

/**
 * Validate and sanitize user-provided error details
 * (e.g., from validation libraries)
 */
export function sanitizeValidationErrors(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];

  const isDevelopment = process.env.NODE_ENV === 'development';

  return errors
    .filter(e => typeof e === 'string' || (typeof e === 'object' && e !== null))
    .map(e => {
      if (typeof e === 'string') return e;
      if (typeof e === 'object' && 'message' in e) {
        return String((e as { message: unknown }).message);
      }
      return isDevelopment ? JSON.stringify(e) : 'Validation error';
    })
    .slice(0, 10); // Limit to prevent DoS through large error arrays
}
