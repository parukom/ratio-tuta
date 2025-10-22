/**
 * Rate Limiting Utility
 * In-memory rate limiter for API endpoints
 * For production with multiple instances, consider Redis-based solution
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max number of unique tokens to track
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

class RateLimiter {
  private tokenCache: Map<string, number[]>
  private interval: number
  private uniqueTokenPerInterval: number

  constructor(config: RateLimitConfig) {
    this.tokenCache = new Map()
    this.interval = config.interval
    this.uniqueTokenPerInterval = config.uniqueTokenPerInterval
  }

  check(identifier: string, limit: number): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.interval

    // Get or create token bucket
    const timestamps = this.tokenCache.get(identifier) || []

    // Filter out timestamps outside current window
    const validTimestamps = timestamps.filter(ts => ts > windowStart)

    // Check if limit exceeded
    const success = validTimestamps.length < limit

    if (success) {
      validTimestamps.push(now)
    }

    // Update cache
    this.tokenCache.set(identifier, validTimestamps)

    // Cleanup old entries to prevent memory leak
    if (this.tokenCache.size > this.uniqueTokenPerInterval) {
      this.cleanup(windowStart)
    }

    return {
      success,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      reset: windowStart + this.interval,
    }
  }

  private cleanup(windowStart: number) {
    for (const [key, timestamps] of this.tokenCache.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart)
      if (validTimestamps.length === 0) {
        this.tokenCache.delete(key)
      } else {
        this.tokenCache.set(key, validTimestamps)
      }
    }
  }

  reset(identifier: string) {
    this.tokenCache.delete(identifier)
  }
}

// Pre-configured rate limiters for different use cases
export const authLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
})

export const strictAuthLimiter = new RateLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
})

export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

/**
 * Rate limit configuration presets
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
} as const

/**
 * Get client identifier from request (IP + User-Agent)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] :
             request.headers.get('x-real-ip') ||
             'unknown'

  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Hash to prevent storing raw IPs
  return `${ip}:${userAgent.substring(0, 50)}`
}

/**
 * Apply rate limit to endpoint
 */
export async function rateLimit(
  request: Request,
  limiter: RateLimiter,
  limit: number
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request)
  return limiter.check(identifier, limit)
}
