# Metrics & Alerting Guidelines

This document defines the metrics collection strategy, alerting rules, and
dashboard recommendations for products built from create-gmacko-app.

## Metrics Collection

### Architecture

```
┌─────────────┐     ┌───────────────┐     ┌──────────────┐
│  Next.js App │────▶│  /api/metrics │────▶│  Prometheus   │
│  @gmacko/    │     │  (Prom format)│     │  / Grafana    │
│  metrics     │     └───────────────┘     │  Agent        │
└─────────────┘                            └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │   Grafana     │
                                           │  Dashboards   │
                                           └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │  Alertmanager │
                                           │  / PagerDuty  │
                                           └──────────────┘
```

### Built-in Metrics

The `@gmacko/metrics` package provides these metrics out of the box:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route | Request latency |
| `http_active_connections` | Gauge | — | Currently active connections |
| `db_queries_total` | Counter | operation, table | Total database queries |
| `db_query_duration_seconds` | Histogram | operation, table | Query latency |
| `db_connection_pool_size` | Gauge | state | Connection pool utilization |
| `cache_operations_total` | Counter | operation, result | Cache hit/miss ratio |
| `jobs_processed_total` | Counter | queue, status | Background job throughput |
| `job_duration_seconds` | Histogram | queue | Job processing time |
| `active_users` | Gauge | — | Currently active users |
| `api_key_usage_total` | Counter | key_id, endpoint | API key usage tracking |

### Node.js Runtime Metrics (when prom-client is installed)

- `nodejs_heap_size_total_bytes` — V8 heap total
- `nodejs_heap_size_used_bytes` — V8 heap used
- `nodejs_external_memory_bytes` — External memory
- `nodejs_eventloop_lag_seconds` — Event loop lag
- `nodejs_active_handles_total` — Active handles
- `nodejs_gc_duration_seconds` — GC pause duration

### Custom Metrics

Add business-specific metrics using the registry:

```typescript
import { metrics } from "@gmacko/metrics";

// Custom counter for feature usage
const featureUsage = metrics.counter(
  "feature_usage_total",
  "Feature usage tracking",
  ["feature", "plan"]
);

featureUsage.inc({ feature: "export", plan: "pro" });
```

## Alerting Rules

### Critical (SEV-1) — Immediate Response

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| **ServiceDown** | `up == 0` | 2m | Page on-call, check deployment |
| **HighErrorRate** | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` | 5m | Page on-call, check Sentry |
| **DatabaseDown** | Health check DB status = "fail" | 1m | Page on-call, check Neon |
| **HighMemoryUsage** | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes > 0.9` | 5m | Page on-call, potential memory leak |

### Warning (SEV-2) — Response within 1 hour

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| **HighLatency** | `histogram_quantile(0.95, http_request_duration_seconds) > 2` | 10m | Investigate slow endpoints |
| **HighDBLatency** | `histogram_quantile(0.95, db_query_duration_seconds) > 1` | 10m | Check slow queries, indexes |
| **LowCacheHitRate** | `rate(cache_operations_total{result="hit"}[10m]) / rate(cache_operations_total[10m]) < 0.5` | 15m | Review cache configuration |
| **JobQueueBacklog** | `jobs_pending > 1000` | 10m | Scale workers, check for stuck jobs |
| **HighMemoryUsage** | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes > 0.75` | 10m | Monitor, prepare for restart |

### Informational (SEV-3/4) — Next business day

| Alert | Condition | For | Action |
|-------|-----------|-----|--------|
| **DependenciesOutdated** | CI weekly check fails | — | Review Renovate PRs |
| **CertExpiringSoon** | SSL cert expires in <30 days | — | Renew certificate |
| **DiskSpaceWarning** | Disk usage >80% | — | Clean up or expand storage |

## Dashboard Recommendations

### 1. Service Overview Dashboard

**Panels:**
- Request rate (requests/second) — timeseries
- Error rate (%) — timeseries with threshold line at 1%
- P50/P95/P99 latency — timeseries
- Active connections — gauge
- Uptime percentage — stat panel

### 2. Database Dashboard

**Panels:**
- Query rate by operation (SELECT/INSERT/UPDATE/DELETE) — stacked timeseries
- Query latency P50/P95 — timeseries
- Connection pool utilization — gauge
- Slow queries (>1s) count — stat panel

### 3. Business Metrics Dashboard

**Panels:**
- Active users — timeseries
- Feature usage breakdown — bar chart
- Plan distribution — pie chart
- API key usage by endpoint — table
- Revenue metrics (from Stripe) — stat panels

### 4. Infrastructure Dashboard

**Panels:**
- Node.js heap usage — timeseries
- Event loop lag — timeseries
- GC pause duration — histogram
- Cache hit rate — gauge
- Background job throughput — timeseries

## Setup Guide

### Option A: Grafana Cloud (Recommended for SaaS)

1. Create a Grafana Cloud account
2. Configure Grafana Agent to scrape `/api/metrics`
3. Import dashboard templates from this repo
4. Set up alerting rules in Grafana Alerting

### Option B: Self-hosted Prometheus + Grafana

1. Add Prometheus scrape target:
   ```yaml
   scrape_configs:
     - job_name: 'myapp'
       scrape_interval: 15s
       metrics_path: '/api/metrics'
       bearer_token: '<METRICS_SECRET>'
       static_configs:
         - targets: ['myapp.example.com']
   ```

2. Configure Alertmanager for notifications:
   ```yaml
   receivers:
     - name: 'pagerduty'
       pagerduty_configs:
         - service_key: '<PD_SERVICE_KEY>'
     - name: 'slack'
       slack_configs:
         - channel: '#alerts'
           api_url: '<SLACK_WEBHOOK_URL>'
   ```

### Option C: Datadog / New Relic

The `/api/metrics` endpoint serves Prometheus format, which both Datadog and
New Relic can ingest natively via their agents.

## Environment Variables

```bash
# Protect the metrics endpoint in production
METRICS_SECRET='your-secret-token'

# Optional: StatsD for UDP-based metrics (DataDog Agent)
# STATSD_HOST='localhost'
# STATSD_PORT='8125'
```
