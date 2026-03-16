/**
 * @gmacko/cache — Multi-backend Caching Layer
 *
 * Provides a unified caching interface with in-memory (dev) and Redis (production)
 * backends. Supports TTL, namespaces, cache-aside pattern, and batch operations.
 *
 * Usage:
 *   import { createCache } from "@gmacko/cache";
 *
 *   const cache = createCache({ prefix: "myapp" });
 *
 *   // Simple get/set
 *   await cache.set("user:123", userData, { ttl: 3600 });
 *   const user = await cache.get<User>("user:123");
 *
 *   // Cache-aside (fetch-through)
 *   const user = await cache.getOrSet("user:123", () => db.getUser("123"), { ttl: 3600 });
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CacheConfig {
  /** Key prefix to namespace cache entries (default: "cache") */
  prefix?: string;
  /** Default TTL in seconds (default: 300 = 5 minutes) */
  defaultTtl?: number;
  /** Max entries for in-memory store (default: 10000) */
  maxMemoryEntries?: number;
}

export interface CacheSetOptions {
  /** TTL in seconds. Use 0 for no expiration. */
  ttl?: number;
}

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  /** Delete all keys matching a pattern (e.g., "user:*") */
  delPattern?(pattern: string): Promise<number>;
  /** Get multiple keys at once */
  mget?(keys: string[]): Promise<(string | null)[]>;
  /** Set multiple keys at once */
  mset?(entries: Array<{ key: string; value: string; ttl?: number }>): Promise<void>;
}

export interface Cache {
  /** Get a cached value, parsed from JSON */
  get<T = unknown>(key: string): Promise<T | null>;
  /** Set a value in the cache (serialized to JSON) */
  set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  /** Delete a cached value */
  del(key: string): Promise<void>;
  /** Check if a key exists */
  has(key: string): Promise<boolean>;
  /** Get or set — fetch from cache, or call fn and cache the result */
  getOrSet<T>(key: string, fn: () => Promise<T>, options?: CacheSetOptions): Promise<T>;
  /** Delete all keys matching a prefix pattern */
  invalidate(pattern: string): Promise<number>;
  /** Get multiple values */
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;
  /** Wrap a function with caching */
  wrap<TArgs extends unknown[], TReturn>(
    keyFn: (...args: TArgs) => string,
    fn: (...args: TArgs) => Promise<TReturn>,
    options?: CacheSetOptions,
  ): (...args: TArgs) => Promise<TReturn>;
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

class MemoryCacheStore implements CacheStore {
  private store = new Map<string, MemoryEntry>();
  private maxEntries: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(maxEntries = 10_000) {
    this.maxEntries = maxEntries;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async delPattern(pattern: string): Promise<number> {
    const prefix = pattern.replace("*", "");
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map((k) => this.get(k)));
  }

  async mset(entries: Array<{ key: string; value: string; ttl?: number }>): Promise<void> {
    for (const { key, value, ttl } of entries) {
      await this.set(key, value, ttl);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ─── Redis Store ─────────────────────────────────────────────────────────────

/**
 * Redis-backed cache store.
 * Requires ioredis as a peer dependency.
 */
export class RedisCacheStore implements CacheStore {
  private redis: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    pipeline(): {
      set(key: string, value: string, ...args: unknown[]): unknown;
      exec(): Promise<unknown>;
    };
  };

  constructor(redisClient: RedisCacheStore["redis"]) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(key, value, "EX", ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    let count = 0;
    for (const key of keys) {
      await this.redis.del(key);
      count++;
    }
    return count;
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    return this.redis.mget(...keys);
  }

  async mset(entries: Array<{ key: string; value: string; ttl?: number }>): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const { key, value, ttl } of entries) {
      if (ttl) {
        pipeline.set(key, value, "EX", ttl);
      } else {
        pipeline.set(key, value);
      }
    }
    await pipeline.exec();
  }
}

// ─── Cache Factory ───────────────────────────────────────────────────────────

/**
 * Create a cache instance.
 *
 * @param config - Cache configuration
 * @param store - Optional backing store (defaults to in-memory)
 */
export function createCache(
  config: CacheConfig = {},
  store?: CacheStore,
): Cache {
  const { prefix = "cache", defaultTtl = 300, maxMemoryEntries = 10_000 } = config;
  const backingStore = store ?? new MemoryCacheStore(maxMemoryEntries);

  function prefixKey(key: string): string {
    return `${prefix}:${key}`;
  }

  const cache: Cache = {
    async get<T>(key: string): Promise<T | null> {
      const raw = await backingStore.get(prefixKey(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
      const ttl = options?.ttl ?? defaultTtl;
      await backingStore.set(prefixKey(key), JSON.stringify(value), ttl || undefined);
    },

    async del(key: string): Promise<void> {
      await backingStore.del(prefixKey(key));
    },

    async has(key: string): Promise<boolean> {
      return backingStore.has(prefixKey(key));
    },

    async getOrSet<T>(
      key: string,
      fn: () => Promise<T>,
      options?: CacheSetOptions,
    ): Promise<T> {
      const cached = await cache.get<T>(key);
      if (cached !== null) return cached;

      const value = await fn();
      await cache.set(key, value, options);
      return value;
    },

    async invalidate(pattern: string): Promise<number> {
      if (backingStore.delPattern) {
        return backingStore.delPattern(`${prefix}:${pattern}`);
      }
      return 0;
    },

    async mget<T>(keys: string[]): Promise<(T | null)[]> {
      if (backingStore.mget) {
        const results = await backingStore.mget(keys.map(prefixKey));
        return results.map((r) => {
          if (r === null) return null;
          try {
            return JSON.parse(r) as T;
          } catch {
            return null;
          }
        });
      }
      return Promise.all(keys.map((k) => cache.get<T>(k)));
    },

    wrap<TArgs extends unknown[], TReturn>(
      keyFn: (...args: TArgs) => string,
      fn: (...args: TArgs) => Promise<TReturn>,
      options?: CacheSetOptions,
    ): (...args: TArgs) => Promise<TReturn> {
      return async (...args: TArgs) => {
        const key = keyFn(...args);
        return cache.getOrSet<TReturn>(key, () => fn(...args), options);
      };
    },
  };

  return cache;
}
