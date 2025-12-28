/**
 * Production-ready rate limiter for server actions
 * Uses sliding window algorithm for more accurate rate limiting
 * For high-traffic production, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  timestamps: number[] // Sliding window timestamps
  blockedUntil?: number // If blocked, when to unblock
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries with no recent activity (older than max window)
      const maxWindow = 3600 * 1000 // 1 hour
      const recentTimestamps = entry.timestamps.filter(t => now - t < maxWindow)
      
      if (recentTimestamps.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
        rateLimitStore.delete(key)
      } else {
        entry.timestamps = recentTimestamps
      }
    }
  }, CLEANUP_INTERVAL)
  
  // Prevent timer from keeping process alive
  if (cleanupTimer.unref) {
    cleanupTimer.unref()
  }
}

interface RateLimitOptions {
  /** Maximum number of requests allowed */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Block duration in seconds after limit exceeded (optional) */
  blockDurationSeconds?: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number // seconds until reset
  blocked: boolean
}

/**
 * Check rate limit for a given identifier using sliding window
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  startCleanup()
  
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const key = `${identifier}:${options.limit}:${options.windowSeconds}`
  
  let entry = rateLimitStore.get(key)
  
  // Initialize entry if not exists
  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(key, entry)
  }
  
  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.blockedUntil - now) / 1000),
      blocked: true,
    }
  }
  
  // Clear block if expired
  if (entry.blockedUntil && entry.blockedUntil <= now) {
    entry.blockedUntil = undefined
  }
  
  // Filter timestamps within the window (sliding window)
  const windowStart = now - windowMs
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)
  
  // Check if limit exceeded
  if (entry.timestamps.length >= options.limit) {
    // Apply block if configured
    if (options.blockDurationSeconds) {
      entry.blockedUntil = now + (options.blockDurationSeconds * 1000)
    }
    
    // Calculate when the oldest request will expire
    const oldestTimestamp = Math.min(...entry.timestamps)
    const resetIn = Math.ceil((oldestTimestamp + windowMs - now) / 1000)
    
    return {
      success: false,
      remaining: 0,
      resetIn: options.blockDurationSeconds || resetIn,
      blocked: !!options.blockDurationSeconds,
    }
  }
  
  // Add current timestamp
  entry.timestamps.push(now)
  
  return {
    success: true,
    remaining: options.limit - entry.timestamps.length,
    resetIn: options.windowSeconds,
    blocked: false,
  }
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // For form submissions (contact, reviews) - 5 per minute
  form: { limit: 5, windowSeconds: 60 },
  // For API calls (search, autocomplete) - 30 per minute
  api: { limit: 30, windowSeconds: 60 },
  // For authentication attempts - 5 per 5 minutes, block for 15 minutes
  auth: { limit: 5, windowSeconds: 300, blockDurationSeconds: 900 },
  // For order creation - 3 per minute
  order: { limit: 3, windowSeconds: 60 },
  // For stock notifications - 10 per hour
  notification: { limit: 10, windowSeconds: 3600 },
  // For admin actions - 20 per minute
  admin: { limit: 20, windowSeconds: 60 },
  // Strict limit for sensitive operations - 3 per 5 minutes, block for 30 minutes
  strict: { limit: 3, windowSeconds: 300, blockDurationSeconds: 1800 },
} as const

/**
 * Get client identifier from headers (for server actions)
 * Falls back to a random ID if no identifier available
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get IP from various headers (in order of reliability)
  const cfConnectingIp = headers.get('cf-connecting-ip') // Cloudflare
  if (cfConnectingIp) return cfConnectingIp
  
  const xRealIp = headers.get('x-real-ip') // Nginx
  if (xRealIp) return xRealIp
  
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // Get the first IP (client IP) from the chain
    return forwarded.split(',')[0].trim()
  }
  
  // Fallback to anonymous (not ideal but prevents crashes)
  return 'anonymous'
}

/**
 * Reset rate limit for a specific identifier
 * Useful for admin override or after successful verification
 */
export function resetRateLimit(identifier: string): void {
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${identifier}:`)) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  options: RateLimitOptions
): { count: number; remaining: number; blocked: boolean } {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const key = `${identifier}:${options.limit}:${options.windowSeconds}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    return { count: 0, remaining: options.limit, blocked: false }
  }
  
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return { count: options.limit, remaining: 0, blocked: true }
  }
  
  const windowStart = now - windowMs
  const recentCount = entry.timestamps.filter(t => t > windowStart).length
  
  return {
    count: recentCount,
    remaining: Math.max(0, options.limit - recentCount),
    blocked: false,
  }
}
