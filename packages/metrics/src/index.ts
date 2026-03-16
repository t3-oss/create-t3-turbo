/**
 * @gmacko/metrics — Application Metrics Collection
 *
 * Provides a unified interface for collecting and exposing application metrics.
 * Supports Prometheus format natively, with optional StatsD export.
 *
 * Usage:
 *   import { metrics, createMetrics } from "@gmacko/metrics";
 *
 *   // Use default singleton
 *   metrics.httpRequestsTotal.inc({ method: "GET", route: "/api/health", status: "200" });
 *   metrics.httpRequestDuration.observe({ method: "GET", route: "/api/health" }, 0.042);
 *
 *   // Or create a custom registry
 *   const m = createMetrics({ prefix: "myapp_", defaultLabels: { service: "api" } });
 *
 * Expose metrics endpoint:
 *   // In app/api/metrics/route.ts
 *   import { getMetricsHandler } from "@gmacko/metrics";
 *   export const GET = getMetricsHandler();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricsConfig {
  /** Prefix for all metric names (e.g., "myapp_") */
  prefix?: string;
  /** Default labels applied to all metrics */
  defaultLabels?: Record<string, string>;
  /** Enable default Node.js runtime metrics (memory, event loop, GC) */
  collectDefaultMetrics?: boolean;
  /** Collection interval for default metrics in ms (default: 10000) */
  defaultMetricsInterval?: number;
}

export interface Counter {
  inc(labels?: Record<string, string>, value?: number): void;
}

export interface Gauge {
  set(labels: Record<string, string>, value: number): void;
  inc(labels?: Record<string, string>, value?: number): void;
  dec(labels?: Record<string, string>, value?: number): void;
}

export interface Histogram {
  observe(labels: Record<string, string>, value: number): void;
  startTimer(labels?: Record<string, string>): () => number;
}

export interface Summary {
  observe(labels: Record<string, string>, value: number): void;
}

export interface MetricsRegistry {
  /** HTTP request counter (method, route, status) */
  httpRequestsTotal: Counter;
  /** HTTP request duration in seconds (method, route) */
  httpRequestDuration: Histogram;
  /** Active HTTP connections */
  httpActiveConnections: Gauge;
  /** Database query counter (operation, table) */
  dbQueriesTotal: Counter;
  /** Database query duration in seconds (operation, table) */
  dbQueryDuration: Histogram;
  /** Active database connections */
  dbConnectionPoolSize: Gauge;
  /** Cache hit/miss counter (operation, result: hit|miss) */
  cacheOperationsTotal: Counter;
  /** Background job counter (queue, status: success|failure) */
  jobsProcessedTotal: Counter;
  /** Background job duration in seconds (queue) */
  jobDuration: Histogram;
  /** Business metric: active users gauge */
  activeUsers: Gauge;
  /** Business metric: API key usage counter */
  apiKeyUsageTotal: Counter;
  /** Custom counter */
  counter(name: string, help: string, labelNames?: string[]): Counter;
  /** Custom gauge */
  gauge(name: string, help: string, labelNames?: string[]): Gauge;
  /** Custom histogram */
  histogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram;
  /** Serialize all metrics to Prometheus text format */
  serialize(): Promise<string>;
  /** Reset all metrics (useful for testing) */
  reset(): void;
}

// ---------------------------------------------------------------------------
// In-memory implementation (works without prom-client)
// ---------------------------------------------------------------------------

interface MetricValue {
  labels: Record<string, string>;
  value: number;
}

class InMemoryCounter implements Counter {
  private values: MetricValue[] = [];
  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: string[],
    private defaultLabels: Record<string, string>,
  ) {}

  inc(labels: Record<string, string> = {}, value = 1): void {
    const merged = { ...this.defaultLabels, ...labels };
    const existing = this.values.find(
      (v) => JSON.stringify(v.labels) === JSON.stringify(merged),
    );
    if (existing) {
      existing.value += value;
    } else {
      this.values.push({ labels: merged, value });
    }
  }

  toPrometheus(): string {
    if (this.values.length === 0) return "";
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const v of this.values) {
      const labelStr = Object.entries(v.labels)
        .map(([k, val]) => `${k}="${val}"`)
        .join(",");
      lines.push(labelStr ? `${this.name}{${labelStr}} ${v.value}` : `${this.name} ${v.value}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.values = [];
  }
}

class InMemoryGauge implements Gauge {
  private values: MetricValue[] = [];
  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: string[],
    private defaultLabels: Record<string, string>,
  ) {}

  private getOrCreate(labels: Record<string, string>): MetricValue {
    const merged = { ...this.defaultLabels, ...labels };
    let existing = this.values.find(
      (v) => JSON.stringify(v.labels) === JSON.stringify(merged),
    );
    if (!existing) {
      existing = { labels: merged, value: 0 };
      this.values.push(existing);
    }
    return existing;
  }

  set(labels: Record<string, string>, value: number): void {
    this.getOrCreate(labels).value = value;
  }

  inc(labels: Record<string, string> = {}, value = 1): void {
    this.getOrCreate(labels).value += value;
  }

  dec(labels: Record<string, string> = {}, value = 1): void {
    this.getOrCreate(labels).value -= value;
  }

  toPrometheus(): string {
    if (this.values.length === 0) return "";
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} gauge`];
    for (const v of this.values) {
      const labelStr = Object.entries(v.labels)
        .map(([k, val]) => `${k}="${val}"`)
        .join(",");
      lines.push(labelStr ? `${this.name}{${labelStr}} ${v.value}` : `${this.name} ${v.value}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.values = [];
  }
}

class InMemoryHistogram implements Histogram {
  private observations: { labels: Record<string, string>; values: number[] }[] = [];
  private bucketBounds: number[];

  constructor(
    readonly name: string,
    readonly help: string,
    readonly labelNames: string[],
    private defaultLabels: Record<string, string>,
    buckets?: number[],
  ) {
    this.bucketBounds = buckets ?? [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  observe(labels: Record<string, string>, value: number): void {
    const merged = { ...this.defaultLabels, ...labels };
    let existing = this.observations.find(
      (o) => JSON.stringify(o.labels) === JSON.stringify(merged),
    );
    if (!existing) {
      existing = { labels: merged, values: [] };
      this.observations.push(existing);
    }
    existing.values.push(value);
  }

  startTimer(labels: Record<string, string> = {}): () => number {
    const start = performance.now();
    return () => {
      const duration = (performance.now() - start) / 1000;
      this.observe(labels, duration);
      return duration;
    };
  }

  toPrometheus(): string {
    if (this.observations.length === 0) return "";
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const obs of this.observations) {
      const labelStr = Object.entries(obs.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(",");
      const prefix = labelStr ? `${this.name}{${labelStr},` : `${this.name}{`;
      const sum = obs.values.reduce((a, b) => a + b, 0);
      let cumulativeCount = 0;
      for (const bound of this.bucketBounds) {
        cumulativeCount += obs.values.filter((v) => v <= bound).length;
        lines.push(`${prefix}le="${bound}"} ${cumulativeCount}`);
      }
      lines.push(`${prefix}le="+Inf"} ${obs.values.length}`);
      lines.push(`${this.name}_sum${labelStr ? `{${labelStr}}` : ""} ${sum}`);
      lines.push(`${this.name}_count${labelStr ? `{${labelStr}}` : ""} ${obs.values.length}`);
    }
    return lines.join("\n");
  }

  reset(): void {
    this.observations = [];
  }
}

// ---------------------------------------------------------------------------
// Registry factory
// ---------------------------------------------------------------------------

function createInMemoryRegistry(config: MetricsConfig): MetricsRegistry {
  const prefix = config.prefix ?? "";
  const defaults = config.defaultLabels ?? {};
  const counters: InMemoryCounter[] = [];
  const gauges: InMemoryGauge[] = [];
  const histograms: InMemoryHistogram[] = [];

  function makeCounter(name: string, help: string, labelNames: string[] = []): InMemoryCounter {
    const c = new InMemoryCounter(prefix + name, help, labelNames, defaults);
    counters.push(c);
    return c;
  }

  function makeGauge(name: string, help: string, labelNames: string[] = []): InMemoryGauge {
    const g = new InMemoryGauge(prefix + name, help, labelNames, defaults);
    gauges.push(g);
    return g;
  }

  function makeHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): InMemoryHistogram {
    const h = new InMemoryHistogram(prefix + name, help, labelNames, defaults, buckets);
    histograms.push(h);
    return h;
  }

  const registry: MetricsRegistry = {
    httpRequestsTotal: makeCounter("http_requests_total", "Total HTTP requests", [
      "method",
      "route",
      "status",
    ]),
    httpRequestDuration: makeHistogram(
      "http_request_duration_seconds",
      "HTTP request duration in seconds",
      ["method", "route"],
    ),
    httpActiveConnections: makeGauge("http_active_connections", "Active HTTP connections"),
    dbQueriesTotal: makeCounter("db_queries_total", "Total database queries", [
      "operation",
      "table",
    ]),
    dbQueryDuration: makeHistogram(
      "db_query_duration_seconds",
      "Database query duration in seconds",
      ["operation", "table"],
    ),
    dbConnectionPoolSize: makeGauge("db_connection_pool_size", "Database connection pool size", [
      "state",
    ]),
    cacheOperationsTotal: makeCounter("cache_operations_total", "Cache operations", [
      "operation",
      "result",
    ]),
    jobsProcessedTotal: makeCounter("jobs_processed_total", "Background jobs processed", [
      "queue",
      "status",
    ]),
    jobDuration: makeHistogram("job_duration_seconds", "Background job duration in seconds", [
      "queue",
    ]),
    activeUsers: makeGauge("active_users", "Number of active users"),
    apiKeyUsageTotal: makeCounter("api_key_usage_total", "API key usage", ["key_id", "endpoint"]),

    counter: (name, help, labelNames) => makeCounter(name, help, labelNames),
    gauge: (name, help, labelNames) => makeGauge(name, help, labelNames),
    histogram: (name, help, labelNames, buckets) =>
      makeHistogram(name, help, labelNames, buckets),

    async serialize() {
      const parts: string[] = [];
      for (const c of counters) {
        const text = c.toPrometheus();
        if (text) parts.push(text);
      }
      for (const g of gauges) {
        const text = g.toPrometheus();
        if (text) parts.push(text);
      }
      for (const h of histograms) {
        const text = h.toPrometheus();
        if (text) parts.push(text);
      }
      return parts.join("\n\n") + "\n";
    },

    reset() {
      counters.forEach((c) => c.reset());
      gauges.forEach((g) => g.reset());
      histograms.forEach((h) => h.reset());
    },
  };

  return registry;
}

// ---------------------------------------------------------------------------
// Prometheus (prom-client) implementation — used when prom-client is installed
// ---------------------------------------------------------------------------

function tryCreatePromClientRegistry(config: MetricsConfig): MetricsRegistry | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const promClient = require("prom-client") as typeof import("prom-client");
    const registry = new promClient.Registry();

    if (config.defaultLabels) {
      registry.setDefaultLabels(config.defaultLabels);
    }

    if (config.collectDefaultMetrics !== false) {
      promClient.collectDefaultMetrics({
        register: registry,
        prefix: config.prefix,
      });
    }

    const prefix = config.prefix ?? "";

    function makeCounter(name: string, help: string, labelNames: string[] = []): Counter {
      return new promClient.Counter({ name: prefix + name, help, labelNames, registers: [registry] });
    }

    function makeGauge(name: string, help: string, labelNames: string[] = []): Gauge {
      const g = new promClient.Gauge({ name: prefix + name, help, labelNames, registers: [registry] });
      return {
        set: (labels, value) => g.set(labels, value),
        inc: (labels, value) => g.inc(labels ?? {}, value),
        dec: (labels, value) => g.dec(labels ?? {}, value),
      };
    }

    function makeHistogram(
      name: string,
      help: string,
      labelNames: string[] = [],
      buckets?: number[],
    ): Histogram {
      const h = new promClient.Histogram({
        name: prefix + name,
        help,
        labelNames,
        buckets: buckets ?? promClient.exponentialBuckets(0.005, 2, 12),
        registers: [registry],
      });
      return {
        observe: (labels, value) => h.observe(labels, value),
        startTimer: (labels) => h.startTimer(labels),
      };
    }

    return {
      httpRequestsTotal: makeCounter("http_requests_total", "Total HTTP requests", [
        "method",
        "route",
        "status",
      ]),
      httpRequestDuration: makeHistogram(
        "http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "route"],
      ),
      httpActiveConnections: makeGauge("http_active_connections", "Active HTTP connections"),
      dbQueriesTotal: makeCounter("db_queries_total", "Total database queries", [
        "operation",
        "table",
      ]),
      dbQueryDuration: makeHistogram(
        "db_query_duration_seconds",
        "Database query duration in seconds",
        ["operation", "table"],
      ),
      dbConnectionPoolSize: makeGauge("db_connection_pool_size", "Database connection pool size", [
        "state",
      ]),
      cacheOperationsTotal: makeCounter("cache_operations_total", "Cache operations", [
        "operation",
        "result",
      ]),
      jobsProcessedTotal: makeCounter("jobs_processed_total", "Background jobs processed", [
        "queue",
        "status",
      ]),
      jobDuration: makeHistogram("job_duration_seconds", "Background job duration in seconds", [
        "queue",
      ]),
      activeUsers: makeGauge("active_users", "Number of active users"),
      apiKeyUsageTotal: makeCounter("api_key_usage_total", "API key usage", [
        "key_id",
        "endpoint",
      ]),

      counter: (name, help, labelNames) => makeCounter(name, help, labelNames),
      gauge: (name, help, labelNames) => makeGauge(name, help, labelNames),
      histogram: (name, help, labelNames, buckets) =>
        makeHistogram(name, help, labelNames, buckets),

      async serialize() {
        return registry.metrics();
      },

      reset() {
        registry.resetMetrics();
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a metrics registry. Uses prom-client if installed, falls back
 * to a lightweight in-memory implementation.
 */
export function createMetrics(config: MetricsConfig = {}): MetricsRegistry {
  return tryCreatePromClientRegistry(config) ?? createInMemoryRegistry(config);
}

/** Default singleton metrics registry */
export const metrics: MetricsRegistry = createMetrics({
  prefix: "",
  collectDefaultMetrics: typeof process !== "undefined" && typeof process.versions?.node === "string",
});

/**
 * Returns a Next.js route handler that serves metrics in Prometheus format.
 *
 * Usage in app/api/metrics/route.ts:
 *   import { getMetricsHandler } from "@gmacko/metrics";
 *   export const GET = getMetricsHandler();
 */
export function getMetricsHandler(registry?: MetricsRegistry) {
  const reg = registry ?? metrics;
  return async function GET() {
    const body = await reg.serialize();
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  };
}

/**
 * tRPC middleware that records request metrics.
 *
 * Usage in tRPC router:
 *   const withMetrics = t.middleware(metricsMiddleware());
 */
export function metricsMiddleware(registry?: MetricsRegistry) {
  const reg = registry ?? metrics;
  return async function metricsMiddlewareFn(opts: {
    path: string;
    type: string;
    next: (opts?: { ctx?: unknown }) => Promise<{ ok: boolean }>;
  }) {
    const endTimer = reg.httpRequestDuration.startTimer({
      method: opts.type,
      route: opts.path,
    });
    const result = await opts.next();
    const duration = endTimer();
    reg.httpRequestsTotal.inc({
      method: opts.type,
      route: opts.path,
      status: result.ok ? "200" : "500",
    });
    void duration;
    return result;
  };
}
