# Operational Runbook

This document provides procedures for common operational tasks, incident
response, and troubleshooting for products built from create-gmacko-app.

## Quick Reference

| Scenario | Action |
|----------|--------|
| Site is down | Check health endpoint, review Sentry, check Vercel status |
| Slow API responses | Check tRPC timing logs, review DB query logs, check rate limits |
| Database issues | Check connection pool, review slow query log, check Neon dashboard |
| Auth failures | Check session cookies, verify OAuth credentials, review auth logs |
| Deploy rollback | Revert via Vercel dashboard or `git revert` + push |
| Enable maintenance | Set `MAINTENANCE_MODE=true` env var, redeploy |

## Health Checks

```bash
# Main health check (includes DB, memory)
curl https://yourapp.com/api/health

# Liveness probe (is the process running?)
curl https://yourapp.com/api/health/live

# Readiness probe (can it serve traffic?)
curl https://yourapp.com/api/health/ready
```

**Response format:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "pass", "responseTime": 12 },
    "memory": { "status": "pass", "heapUsed": "45MB", "percentage": 32 }
  }
}
```

**Thresholds:**
- Memory warning: >75% heap usage → `degraded`
- Memory critical: >90% heap usage → `unhealthy`
- DB timeout: >5s response → `unhealthy`

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| SEV-1 | Service outage, data loss risk | Immediate | Site down, DB unreachable |
| SEV-2 | Major feature broken | <1 hour | Auth not working, payments failing |
| SEV-3 | Minor feature degraded | <4 hours | Slow queries, non-critical errors |
| SEV-4 | Cosmetic / minor | Next business day | UI glitch, typo |

### Response Procedure

1. **Acknowledge** — Confirm the issue, assign an owner
2. **Assess** — Determine severity, check monitoring dashboards
3. **Communicate** — Update status page, notify stakeholders
4. **Mitigate** — Apply immediate fix (rollback, feature flag, maintenance mode)
5. **Resolve** — Deploy permanent fix
6. **Postmortem** — Document root cause, timeline, prevention measures

### Rollback Procedure

**Vercel (primary deployment):**
1. Go to Vercel Dashboard → Deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"

**Git-based rollback:**
```bash
# Revert the problematic commit
git revert <commit-sha>
git push origin main
# Vercel will auto-deploy the revert
```

**Emergency: Enable maintenance mode:**
```bash
# In Vercel Environment Variables, set:
MAINTENANCE_MODE=true
# Trigger redeploy — all traffic redirected to /maintenance
```

## Database Operations

### Connection Issues
```bash
# Check connection from your machine
psql $DATABASE_URL -c "SELECT 1"

# Check active connections (Neon dashboard or SQL)
SELECT count(*) FROM pg_stat_activity;
```

### Slow Queries
- Check structured logs for `component: "database"` entries with high duration
- Drizzle query logging is enabled in development
- Add indexes for frequently filtered columns
- Use `EXPLAIN ANALYZE` for query optimization

### Migrations
```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations (preview first)
pnpm db:migrate

# Emergency: push schema directly (skips migration history)
pnpm db:push
```

### Data Backup & Recovery
- Neon provides point-in-time recovery (PITR)
- Create manual backups before risky migrations:
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- Neon branching can create instant database copies for testing

## Monitoring & Alerting

### Logging
- **Where**: Structured JSON logs via `@gmacko/logging` (Pino)
- **Context**: Request ID, user ID, organization ID propagated via AsyncLocalStorage
- **Levels**: `debug` (dev only), `info` (request lifecycle), `warn` (slow queries >3s), `error` (failures)

### Error Tracking (Sentry)
- **Dashboard**: https://sentry.io → Your Org → Your Project
- **Alerts**: Configure in Sentry → Alerts → Create Rule
- **Recommended alerts**:
  - New issue spike (>10 events in 5 minutes)
  - Error rate threshold (>1% of transactions)
  - Performance regression (p95 latency >2x baseline)

### Analytics (PostHog)
- **Dashboard**: https://app.posthog.com
- Track feature adoption, funnel conversion, user retention
- Feature flags integration for gradual rollouts

### Uptime Monitoring
- Health endpoint: `/api/health`
- Recommended: Configure external uptime monitor (e.g., BetterUptime, Pingdom)
- Alert if health check fails for >2 consecutive minutes

## Common Troubleshooting

### "Error: Environment variable X is missing"
- Check `.env` file exists and has the variable
- For Vercel: check Environment Variables in project settings
- The `@t3-oss/env-nextjs` validation runs at build time

### "TRPCError: UNAUTHORIZED"
- Session cookie may have expired — try logging out and back in
- Check that `AUTH_SECRET` matches between environments
- Verify OAuth provider credentials haven't rotated

### "Database connection timeout"
- Check `DATABASE_URL` is correct
- Neon: check if the compute endpoint is scaled to zero (cold start)
- Docker: check if the postgres container is running

### Build Failures
```bash
# Clean all caches and rebuild
pnpm clean && pnpm clean:workspaces
pnpm install
pnpm build
```

### "Module not found" in monorepo
- Ensure the package is listed in `transpilePackages` in `next.config.js`
- Ensure the package has the correct `exports` field in its `package.json`
- Run `pnpm install` to update workspace links

## Maintenance Windows

### Pre-maintenance Checklist
- [ ] Notify users via email/banner at least 24h in advance
- [ ] Set `MAINTENANCE_MODE=true` at scheduled time
- [ ] Verify maintenance page is showing (check /maintenance)
- [ ] Perform maintenance tasks
- [ ] Run health checks
- [ ] Set `MAINTENANCE_MODE=false`
- [ ] Verify all services are operational
- [ ] Send "all clear" notification

### Dependency Updates
- Renovate creates PRs automatically for dependency updates
- Review and merge weekly for non-breaking updates
- For major version bumps: test in preview environment first
- Run `pnpm audit` monthly for vulnerability check
