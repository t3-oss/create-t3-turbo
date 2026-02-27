/**
 * @gmacko/rate-limit — Sliding Window Rate Limiter
 *
 * Supports in-memory (dev/single-instance) and Redis (production/multi-instance).
 * Designed to integrate with tRPC middleware for per-procedure rate limiting.
 *
 * Usage:
 *   import { createRateLimiter } from "@gmacko/rate-limit";
 *
 *   const limiter = createRateLimiter({ limit: 100, window: 60_000 });
 *   const result = await limiter.check("user:123");
 *   if (!result.allowed) {
 *     throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
 *   }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  limit: number;
  /** Window size in milliseconds (e.g., 60_000 for 1 minute) */
  window: number;
  /** Key prefix to namespace rate limits (default: "rl") */
  prefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Total limit for this window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  reset: number;
}

export interface RateLimitStore {
  /** Increment the count for a key and return the result */
  increment(key: string, windowMs: number): Promise<{ count: number; reset: number }>;
  /** Clean up expired entries (for in-memory store) */
  cleanup?(): void;
}

export interface RateLimiter {
  /** Check if a request is allowed for the given key */
  check(key: string): Promise<RateLimitResult>;
  /** Get rate limit headers for the response */
  headers(result: RateLimitResult): Record<string, string>;
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

class MemoryStore implements RateLimitStore {
  private store = new Map<string, MemoryEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    // Periodic cleanup every 60s to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    // Allow Node.js to exit even if interval is active
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; reset: number }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { count: 1, reset: Math.ceil(resetAt / 1000) };
    }

    // Existing window
    entry.count++;
    return { count: entry.count, reset: Math.ceil(entry.resetAt / 1000) };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ─── Redis Store ─────────────────────────────────────────────────────────────

/**
 * Redis-backed store for distributed rate limiting.
 * Requires ioredis as a peer dependency.
 */
export class RedisStore implements RateLimitStore {
  private redis: {
    eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<unknown>;
  };

  constructor(redisClient: {
    eval(script: string, numkeys: number, ...args: (string | number)[]): Promise<unknown>;
  }) {
    this.redis = redisClient;
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; reset: number }> {
    const windowSec = Math.ceil(windowMs / 1000);
    const now = Math.ceil(Date.now() / 1000);

    // Atomic increment + expire using a Lua script
    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {current, ttl}
    `;

    const result = (await this.redis.eval(script, 1, key, windowSec)) as [
      number,
      number,
    ];
    const count = result[0];
    const ttl = result[1];

    return {
      count,
      reset: now + ttl,
    };
  }
}

// ─── Rate Limiter Factory ────────────────────────────────────────────────────

/**
 * Create a rate limiter instance.
 *
 * @param config - Rate limit configuration
 * @param store - Optional custom store (defaults to in-memory)
 */
export function createRateLimiter(
  config: RateLimitConfig,
  store?: RateLimitStore,
): RateLimiter {
  const backingStore = store ?? new MemoryStore();
  const prefix = config.prefix ?? "rl";

  return {
    async check(key: string): Promise<RateLimitResult> {
      const prefixedKey = `${prefix}:${key}`;
      const { count, reset } = await backingStore.increment(
        prefixedKey,
        config.window,
      );

      const allowed = count <= config.limit;
      const remaining = Math.max(0, config.limit - count);

      return { allowed, limit: config.limit, remaining, reset };
    },

    headers(result: RateLimitResult): Record<string, string> {
      return {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      };
    },
  };
}

// ─── Pre-built Configurations ────────────────────────────────────────────────

/** Standard API rate limits by subscription plan */
export const PLAN_LIMITS = {
  free: { limit: 100, window: 60_000 },
  starter: { limit: 500, window: 60_000 },
  pro: { limit: 2000, window: 60_000 },
  enterprise: { limit: 10_000, window: 60_000 },
} as const;

/** Auth-specific limits (stricter to prevent brute force) */
export const AUTH_LIMITS = {
  login: { limit: 10, window: 900_000 },      // 10 per 15 min
  register: { limit: 5, window: 3_600_000 },  // 5 per hour
  passwordReset: { limit: 3, window: 3_600_000 }, // 3 per hour
} as const;
