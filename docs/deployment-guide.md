# Deployment Guide

Simplified deployment patterns for local development, staging, and production.

## Overview

| Environment | Web Hosting | Database | Monitoring | Analytics |
|-------------|-------------|----------|------------|-----------|
| **Local** | `pnpm dev` (localhost:3000) | Docker Postgres or PGlite | Sentry (dev mode) | PostHog (dev mode) |
| **Staging** | Vercel Preview / Docker | Neon Postgres (staging branch) | Sentry (staging env) | PostHog (staging env) |
| **Production** | Vercel / Docker / Self-hosted | Neon Postgres (main) | Sentry (production env) | PostHog (production env) |

## Local Development

### Option A: Docker Compose (Recommended)

Full local stack with PostgreSQL and Redis:

```bash
# Start infrastructure
docker compose up postgres redis -d

# Set up environment
cp .env.example .env
# Edit .env: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gmacko_dev

# Push schema and seed
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Option B: PGlite (Zero Dependencies)

No Docker needed. Embedded PostgreSQL runs in-process:

```bash
cp .env.example .env
# Edit .env: DATABASE_DRIVER=pglite

pnpm dev
```

The database is stored in `.local/pglite/` and persists between restarts.

### Default Accounts

After seeding, log in with:
- **Admin:** `admin@example.com` / `admin123`
- **Test User:** `test@example.com` / `test123`

## Staging

### Vercel Preview Deployments

Push to any non-main branch to get a preview deployment:

```bash
git push origin feature/my-feature
# Vercel automatically deploys a preview
```

Environment variables for staging:
- `DATABASE_URL` → Neon staging database
- `VERCEL_ENV=preview` (automatic)
- Sentry and PostHog detect the `staging` environment automatically

### Staging Database

Create a separate Neon database branch for staging:

```bash
# In Neon console: create branch 'staging' from 'main'
# Set STAGING_DATABASE_URL in Vercel environment variables
```

## Production

### Vercel (Recommended)

```bash
# Merge to main triggers production deployment
git push origin main
```

Required environment variables in Vercel:
- `DATABASE_URL` — Neon production connection string
- `AUTH_SECRET` — Strong random secret
- `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` — OAuth credentials

Optional (recommended):
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error tracking
- `SENTRY_AUTH_TOKEN` — For source maps
- `NEXT_PUBLIC_POSTHOG_KEY` — Product analytics
- `STRIPE_SECRET_KEY` — Payment processing
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook verification

### Docker

Build and run the production Docker image:

```bash
# Build
docker build -t gmacko-app \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg AUTH_SECRET="$AUTH_SECRET" \
  .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e AUTH_SECRET="$AUTH_SECRET" \
  -e NODE_ENV=production \
  gmacko-app
```

### Health Checks

The app exposes health check endpoints:

- `GET /api/health` — Basic health check
- `GET /api/health/live` — Liveness probe
- `GET /api/health/ready` — Readiness probe (checks database)

## Monitoring Setup

### Sentry

1. Create two Sentry projects: `yourapp-web` and `yourapp-mobile`
2. Set environment variables:

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=your-org
SENTRY_PROJECT_WEB=yourapp-web
```

Sentry automatically detects environments:
- `VERCEL_ENV=production` → Sentry production
- `VERCEL_ENV=preview` → Sentry staging
- Local → Sentry development

### PostHog

1. Create a PostHog project
2. Set environment variables:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Integration Hooks

The `@gmacko/analytics` and `@gmacko/monitoring` packages provide React hooks for deep integration:

```tsx
// In your providers or layout
import { usePageView, useIdentifyUser } from "@gmacko/analytics/web/hooks";
import { useSentryUser } from "@gmacko/monitoring/web/hooks";

function Providers({ children, session }) {
  usePageView();                    // Track route changes
  useIdentifyUser(session?.user);   // Identify user in PostHog
  useSentryUser(session?.user);     // Set Sentry user context

  return children;
}
```

## Database Migrations in Production

See [Drizzle Migrations Guide](./drizzle-migrations.md) for detailed instructions.

Quick summary:

```bash
# Generate migration from schema changes
pnpm --filter @gmacko/db generate

# Apply to staging
DATABASE_URL=$STAGING_DATABASE_URL pnpm --filter @gmacko/db migrate

# Apply to production
DATABASE_URL=$PRODUCTION_DATABASE_URL pnpm --filter @gmacko/db migrate
```

## MCP Server for AI Agents

The MCP server provides tools for AI agents to interact with your app and Stripe:

```bash
# Configure in your AI tool (Claude, etc.)
GMACKO_API_URL=https://your-app.vercel.app
GMACKO_API_KEY=gmk_...
STRIPE_SECRET_KEY=sk_...  # Optional: enables Stripe tools
```

Available tools: posts, preferences, subscriptions, and Stripe (customers, subscriptions, products, prices, invoices, balance).
