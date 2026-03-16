/**
 * In-memory rate limiter middleware for tRPC.
 *
 * For production with multiple server instances, replace with
 * @upstash/ratelimit + Redis for distributed rate limiting.
 *
 * Usage:
 *   import { rateLimitMiddleware } from "../middleware/rate-limit";
 *
 *   export const rateLimitedProcedure = publicProcedure
 *     .use(rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000 }));
 */

import { TRPCError } from "@trpc/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key generator — defaults to session user ID or "anonymous" */
  keyFn?: (ctx: { session?: { user?: { id: string } | null } | null }) => string;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries (every 60s)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 60_000);

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Create a rate limit middleware for tRPC procedures.
 *
 * @example
 * ```ts
 * // 10 requests per minute per user
 * const limited = publicProcedure.use(rateLimitMiddleware({ maxRequests: 10, windowMs: 60_000 }));
 *
 * // 100 requests per minute for API key users
 * const apiLimited = apiKeyReadProcedure.use(rateLimitMiddleware({
 *   maxRequests: 100,
 *   windowMs: 60_000,
 *   keyFn: (ctx) => ctx.apiKeyAuth?.keyId ?? "unknown",
 * }));
 * ```
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyFn = (ctx) => ctx.session?.user?.id ?? "anonymous",
  } = config;

  return async function rateLimit({
    ctx,
    next,
    path,
  }: {
    ctx: { session?: { user?: { id: string } | null } | null };
    next: () => Promise<unknown>;
    path: string;
  }) {
    const key = `${path}:${keyFn(ctx)}`;
    const result = checkRateLimit(key, maxRequests, windowMs);

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(
        (result.resetAt - Date.now()) / 1000,
      );
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      });
    }

    return next();
  };
}

/**
 * Pre-configured rate limiters for common tiers.
 */
export const rateLimits = {
  /** Public endpoints: 30 req/min */
  public: rateLimitMiddleware({ maxRequests: 30, windowMs: 60_000 }),
  /** Authenticated users: 60 req/min */
  authenticated: rateLimitMiddleware({ maxRequests: 60, windowMs: 60_000 }),
  /** Sensitive operations (login, signup): 5 req/min */
  sensitive: rateLimitMiddleware({ maxRequests: 5, windowMs: 60_000 }),
  /** API key users: 120 req/min */
  apiKey: rateLimitMiddleware({ maxRequests: 120, windowMs: 60_000 }),
} as const;
