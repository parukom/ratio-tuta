/**
 * CSRF Token Protection
 *
 * Provides Cross-Site Request Forgery protection via tokens.
 * Works alongside SameSite=strict cookies for defense-in-depth.
 *
 * Token Flow:
 * 1. Client requests CSRF token (GET /api/csrf-token)
 * 2. Server generates token tied to session
 * 3. Client includes token in X-CSRF-Token header for state-changing requests
 * 4. Server validates token matches session
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { SessionData } from '@lib/session';

const CSRF_TOKEN_LENGTH = 32; // 32 bytes = 256 bits

/**
 * Get CSRF secret from environment
 * Falls back to SESSION_SECRET if CSRF_SECRET not set
 */
function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('CSRF_SECRET or SESSION_SECRET must be set');
  }
  return secret;
}

/**
 * Generate CSRF token for a session
 *
 * Token format: random_value.hmac(random_value + userId)
 * This ties the token to the user session without storing state
 */
export function generateCsrfToken(session: SessionData): string {
  const randomValue = randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
  const payload = `${randomValue}:${session.userId}`;
  const signature = createHmac('sha256', getCsrfSecret())
    .update(payload)
    .digest('base64url');

  return `${randomValue}.${signature}`;
}

/**
 * Validate CSRF token for a session
 *
 * @returns true if token is valid, false otherwise
 */
export function validateCsrfToken(
  token: string | null | undefined,
  session: SessionData
): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [randomValue, providedSignature] = parts;

  // Recompute expected signature
  const payload = `${randomValue}:${session.userId}`;
  const expectedSignature = createHmac('sha256', getCsrfSecret())
    .update(payload)
    .digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

/**
 * Middleware helper to require CSRF token
 * Call this in POST/PUT/PATCH/DELETE handlers
 *
 * @throws Error if CSRF validation fails
 */
export function requireCsrfToken(
  request: Request,
  session: SessionData | null
): void {
  if (!session) {
    throw new CsrfError('No active session', 401);
  }

  // Check multiple possible header names
  const token =
    request.headers.get('x-csrf-token') ||
    request.headers.get('csrf-token') ||
    null;

  if (!validateCsrfToken(token, session)) {
    throw new CsrfError('Invalid or missing CSRF token', 403);
  }
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * CSRF validation error
 */
export class CsrfError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'CsrfError';
  }
}

/**
 * Handle CSRF errors in API routes
 */
export function handleCsrfError(error: unknown): {
  error: string;
  status: number;
} {
  if (error instanceof CsrfError) {
    return {
      error: error.message,
      status: error.statusCode,
    };
  }

  return {
    error: 'CSRF validation failed',
    status: 403,
  };
}
