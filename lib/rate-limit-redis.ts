/**
 * Redis-based Rate Limiting for Production
 *
 * Uses Upstash Redis for distributed rate limiting across multiple instances.
 * This replaces the in-memory rate limiter which doesn't work with horizontal scaling.
 *
 * Setup:
 * 1. Create free Upstash Redis database at https://console.upstash.com
 * 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
 * 3. Import this file instead of lib/rate-limit.ts
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis connection (or use mock in development if not configured)
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production'
      );
    }

    // Development fallback: warn and use ephemeral memory store
    console.warn(
      '[Rate Limit] Redis not configured. Using ephemeral in-memory store. ' +
      'This is NOT suitable for production with multiple instances.'
    );

    // Return a mock Redis client for development
    return {
      get: async () => null,
      set: async () => 'OK',
      eval: async () => null,
    } as any;
  }

  return new Redis({
    url,
    token,
  });
}

const redis = getRedisClient();

/**
 * Rate limit configuration presets
 * These match the previous in-memory limits for consistency
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: 5, // 5 attempts per 15 minutes
  REGISTER: 3, // 3 attempts per 15 minutes
  PASSWORD_FORGOT: 3, // 3 attempts per hour
  PASSWORD_RESET: 5, // 5 attempts per hour
  EMAIL_VERIFY_RESEND: 3, // 3 attempts per 15 minutes

  // Financial endpoints (stricter limits)
  RECEIPT_CREATE: 30, // 30 receipts per minute (high-volume businesses)
  PLACE_CREATE: 10, // 10 places per 15 minutes
  ITEM_CREATE: 50, // 50 items per minute
  ITEM_UPDATE: 100, // 100 updates per minute

  // General API
  API_DEFAULT: 60, // 60 requests per minute
} as const;

/**
 * Pre-configured rate limiters for different use cases
 * Using sliding window algorithm for smooth rate limiting
 */
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.LOGIN, '15 m'),
  analytics: true, // Enable analytics for monitoring
  prefix: 'ratelimit:auth',
});

export const strictAuthLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.PASSWORD_FORGOT, '1 h'),
  analytics: true,
  prefix: 'ratelimit:strict-auth',
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.API_DEFAULT, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Get client identifier from request (IP + User-Agent hash)
 *
 * SECURITY: Uses rightmost IP from X-Forwarded-For to prevent spoofing
 * when behind trusted proxy (Vercel, Cloudflare, etc.)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',').map(s => s.trim()).pop() // rightmost = closest to server
    : request.headers.get('x-real-ip') || 'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Combine IP and truncated user-agent for identifier
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Apply rate limit to endpoint with custom limiter
 *
 * @returns Success status and rate limit metadata
 */
export async function rateLimit(
  request: Request,
  limiter: Ratelimit,
  limit?: number // Optional custom limit override
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const identifier = getClientIdentifier(request);

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Create custom rate limiter with specific window and limit
 *
 * Example:
 * const customLimiter = createRateLimiter(100, '1 m', 'custom-endpoint');
 */
export function createRateLimiter(
  limit: number,
  window: string,
  prefix: string
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

/**
 * Reset rate limit for a specific identifier (admin function)
 * Useful for clearing rate limits after resolving false positives
 */
export async function resetRateLimit(identifier: string, prefix: string) {
  const key = `ratelimit:${prefix}:${identifier}`;
  await redis.del(key);
}
