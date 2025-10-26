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
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production',
      );
    }

    // Development fallback: warn and use ephemeral memory store
    console.warn(
      '[Rate Limit] Redis not configured. Using ephemeral in-memory store. ' +
        'This is NOT suitable for production with multiple instances.',
    );

    // Return a mock Redis client for development
    // Must implement all methods used by @upstash/ratelimit
    // Always returns success (remaining: 999) to allow unlimited requests in dev
    return {
      get: async () => null,
      set: async () => 'OK',
      eval: async () => null,
      evalsha: async () => [999, Date.now() + 900000], // Mock: always allow with 999 remaining
      del: async () => 1,
      expire: async () => 1,
      incr: async () => 1,
      pttl: async () => 900000,
    } as unknown as Redis;
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
 * In development, limits are much higher to avoid blocking during testing
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: isDevelopment ? 1000 : 5, // 1000 in dev, 5 in prod attempts per 15 minutes
  REGISTER: isDevelopment ? 1000 : 3, // 1000 in dev, 3 in prod attempts per 15 minutes
  PASSWORD_FORGOT: isDevelopment ? 1000 : 3, // 1000 in dev, 3 in prod attempts per hour
  PASSWORD_RESET: isDevelopment ? 1000 : 5, // 1000 in dev, 5 in prod attempts per hour
  PASSWORD_CHANGE: isDevelopment ? 1000 : 5, // 1000 in dev, 5 in prod attempts per 15 minutes
  EMAIL_VERIFY_RESEND: isDevelopment ? 1000 : 3, // 1000 in dev, 3 in prod attempts per 15 minutes

  // Financial endpoints (stricter limits)
  RECEIPT_CREATE: isDevelopment ? 1000 : 30, // 1000 in dev, 30 in prod receipts per minute
  PLACE_CREATE: isDevelopment ? 1000 : 10, // 1000 in dev, 10 in prod places per 15 minutes
  ITEM_CREATE: isDevelopment ? 1000 : 50, // 1000 in dev, 50 in prod items per minute
  ITEM_UPDATE: isDevelopment ? 1000 : 100, // 1000 in dev, 100 in prod updates per minute

  // General API
  API_DEFAULT: isDevelopment ? 1000 : 60, // 1000 in dev, 60 in prod requests per minute
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

export const passwordChangeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.PASSWORD_CHANGE, '15 m'),
  analytics: true,
  prefix: 'ratelimit:password-change',
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
    ? forwarded
        .split(',')
        .map((s) => s.trim())
        .pop() // rightmost = closest to server
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
  window:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d`,
  prefix: string,
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
