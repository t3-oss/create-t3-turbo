/**
 * @gmacko/metering — Usage Metering & Billing Events
 *
 * Tracks API calls, storage usage, seat counts, and other metered resources
 * for usage-based billing. Integrates with Stripe's metering API for
 * automated invoice generation.
 *
 * Usage:
 *   import { createMeter, trackUsage, getUsageSummary } from "@gmacko/metering";
 *
 *   // Track an API call
 *   await trackUsage({
 *     customerId: "cus_123",
 *     metric: "api_calls",
 *     value: 1,
 *   });
 *
 *   // Get usage for billing period
 *   const summary = await getUsageSummary("cus_123", "api_calls", {
 *     from: periodStart,
 *     to: periodEnd,
 *   });
 */

import { createLogger } from "@gmacko/logging";

const logger = createLogger({ component: "metering" });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UsageEvent {
  /** Customer/organization identifier */
  customerId: string;
  /** Metric name (e.g., "api_calls", "storage_bytes", "seats") */
  metric: string;
  /** Usage value (default: 1 for count-based metrics) */
  value?: number;
  /** Timestamp (default: now) */
  timestamp?: Date;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

export interface UsageSummary {
  customerId: string;
  metric: string;
  total: number;
  count: number;
  from: Date;
  to: Date;
}

export interface MeterConfig {
  /** Flush interval in ms (default: 60000 = 1 minute) */
  flushInterval?: number;
  /** Max events to buffer before auto-flush (default: 100) */
  maxBufferSize?: number;
  /** Custom flush handler (e.g., write to Stripe, database, or analytics) */
  onFlush?: (events: UsageEvent[]) => Promise<void>;
}

export interface UsageStore {
  record(event: UsageEvent): Promise<void>;
  query(
    customerId: string,
    metric: string,
    from: Date,
    to: Date,
  ): Promise<UsageSummary>;
  getMetrics(customerId: string): Promise<string[]>;
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

interface StoredEvent {
  customerId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, string>;
}

class MemoryUsageStore implements UsageStore {
  private events: StoredEvent[] = [];

  async record(event: UsageEvent): Promise<void> {
    this.events.push({
      customerId: event.customerId,
      metric: event.metric,
      value: event.value ?? 1,
      timestamp: event.timestamp ?? new Date(),
      metadata: event.metadata,
    });
  }

  async query(
    customerId: string,
    metric: string,
    from: Date,
    to: Date,
  ): Promise<UsageSummary> {
    const matching = this.events.filter(
      (e) =>
        e.customerId === customerId &&
        e.metric === metric &&
        e.timestamp >= from &&
        e.timestamp <= to,
    );

    return {
      customerId,
      metric,
      total: matching.reduce((sum, e) => sum + e.value, 0),
      count: matching.length,
      from,
      to,
    };
  }

  async getMetrics(customerId: string): Promise<string[]> {
    const metrics = new Set<string>();
    for (const event of this.events) {
      if (event.customerId === customerId) {
        metrics.add(event.metric);
      }
    }
    return Array.from(metrics);
  }
}

// ─── Buffered Meter ──────────────────────────────────────────────────────────

class BufferedMeter {
  private buffer: UsageEvent[] = [];
  private store: UsageStore;
  private config: Required<MeterConfig>;
  private flushTimer: ReturnType<typeof setInterval> | undefined;

  constructor(store: UsageStore, config: MeterConfig = {}) {
    this.store = store;
    this.config = {
      flushInterval: config.flushInterval ?? 60_000,
      maxBufferSize: config.maxBufferSize ?? 100,
      onFlush: config.onFlush ?? (async () => {}),
    };

    this.flushTimer = setInterval(() => void this.flush(), this.config.flushInterval);
    if (this.flushTimer.unref) this.flushTimer.unref();
  }

  async record(event: UsageEvent): Promise<void> {
    const normalized: UsageEvent = {
      ...event,
      value: event.value ?? 1,
      timestamp: event.timestamp ?? new Date(),
    };

    this.buffer.push(normalized);

    if (this.buffer.length >= this.config.maxBufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    // Write to store
    for (const event of events) {
      await this.store.record(event);
    }

    // Call custom flush handler (e.g., Stripe metering API)
    try {
      await this.config.onFlush(events);
    } catch (err) {
      logger.error(
        { err, eventCount: events.length },
        "Failed to flush usage events to external handler",
      );
    }

    logger.debug(
      { eventCount: events.length },
      "Flushed usage events",
    );
  }

  async query(
    customerId: string,
    metric: string,
    from: Date,
    to: Date,
  ): Promise<UsageSummary> {
    // Flush before querying for accuracy
    await this.flush();
    return this.store.query(customerId, metric, from, to);
  }

  async getMetrics(customerId: string): Promise<string[]> {
    return this.store.getMetrics(customerId);
  }

  destroy(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
  }
}

// ─── Singleton & Public API ──────────────────────────────────────────────────

let defaultMeter: BufferedMeter | null = null;

/**
 * Create and configure the usage meter.
 * Call once at app startup.
 */
export function createMeter(
  config: MeterConfig = {},
  store?: UsageStore,
): BufferedMeter {
  const backingStore = store ?? new MemoryUsageStore();
  defaultMeter = new BufferedMeter(backingStore, config);
  return defaultMeter;
}

function getMeter(): BufferedMeter {
  if (!defaultMeter) {
    // Auto-create with defaults
    defaultMeter = new BufferedMeter(new MemoryUsageStore());
  }
  return defaultMeter;
}

/**
 * Track a usage event.
 */
export async function trackUsage(event: UsageEvent): Promise<void> {
  await getMeter().record(event);
}

/**
 * Get usage summary for a customer and metric in a time range.
 */
export async function getUsageSummary(
  customerId: string,
  metric: string,
  range: { from: Date; to: Date },
): Promise<UsageSummary> {
  return getMeter().query(customerId, metric, range.from, range.to);
}

/**
 * Get all tracked metrics for a customer.
 */
export async function getCustomerMetrics(
  customerId: string,
): Promise<string[]> {
  return getMeter().getMetrics(customerId);
}

/**
 * Force flush all buffered events.
 */
export async function flushUsage(): Promise<void> {
  await getMeter().flush();
}

// ─── Pre-defined Metrics ─────────────────────────────────────────────────────

export const METRICS = {
  API_CALLS: "api_calls",
  STORAGE_BYTES: "storage_bytes",
  SEATS: "seats",
  BANDWIDTH_BYTES: "bandwidth_bytes",
  COMPUTE_SECONDS: "compute_seconds",
  MESSAGES_SENT: "messages_sent",
  WEBHOOKS_SENT: "webhooks_sent",
  FILE_UPLOADS: "file_uploads",
  AI_TOKENS: "ai_tokens",
} as const;

// ─── Plan Limits ─────────────────────────────────────────────────────────────

export interface PlanLimits {
  [metric: string]: number | null; // null = unlimited
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    [METRICS.API_CALLS]: 1_000,
    [METRICS.STORAGE_BYTES]: 100 * 1024 * 1024, // 100MB
    [METRICS.SEATS]: 1,
    [METRICS.WEBHOOKS_SENT]: 100,
  },
  starter: {
    [METRICS.API_CALLS]: 50_000,
    [METRICS.STORAGE_BYTES]: 1024 * 1024 * 1024, // 1GB
    [METRICS.SEATS]: 5,
    [METRICS.WEBHOOKS_SENT]: 10_000,
  },
  pro: {
    [METRICS.API_CALLS]: 500_000,
    [METRICS.STORAGE_BYTES]: 10 * 1024 * 1024 * 1024, // 10GB
    [METRICS.SEATS]: 25,
    [METRICS.WEBHOOKS_SENT]: 100_000,
  },
  enterprise: {
    [METRICS.API_CALLS]: null, // unlimited
    [METRICS.STORAGE_BYTES]: null,
    [METRICS.SEATS]: null,
    [METRICS.WEBHOOKS_SENT]: null,
  },
};

/**
 * Check if a customer has exceeded their plan limit for a metric.
 */
export async function checkLimit(
  customerId: string,
  metric: string,
  plan: string,
  period: { from: Date; to: Date },
): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const limits = PLAN_LIMITS[plan];
  if (!limits) return { allowed: true, current: 0, limit: null };

  const limit = limits[metric] ?? null;
  if (limit === null) return { allowed: true, current: 0, limit: null };

  const summary = await getUsageSummary(customerId, metric, period);
  return {
    allowed: summary.total < limit,
    current: summary.total,
    limit,
  };
}
