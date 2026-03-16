# CLAUDE.md — AI Coding Guidelines for create-gmacko-app

This file provides context for AI coding assistants working in this monorepo.

## Project Overview

**create-gmacko-app** is a production-ready monorepo template for SaaS products targeting both B2C and B2B markets. It generates full-stack applications with web (Next.js), mobile (Expo), and shared infrastructure.

**Stack**: Next.js 16 · React 19 · tRPC · Drizzle ORM · Better Auth · Tailwind CSS v4 · Turborepo · pnpm

## Repository Structure

```
apps/
  nextjs/              # Next.js web app (App Router, Server Components)
  expo/                # React Native mobile app
packages/
  api/                 # tRPC routers + OpenAPI spec
  auth/                # Authentication (Better Auth + SAML)
  db/                  # Drizzle schema, migrations, client
  ui/                  # shadcn/ui components
  validators/          # Shared Zod schemas
  config/              # Feature flags & integration toggles
  logging/             # Structured logging (Pino + AsyncLocalStorage)
  monitoring/          # Sentry error tracking
  analytics/           # PostHog analytics
  flags/               # Feature flag system
  jobs/                # Background job queue
  email/               # Transactional email templates
  settings/            # App settings schemas
  audit/               # Audit logging
  rate-limit/          # Sliding-window rate limiter
  webhooks/            # HMAC-signed webhook delivery
  cache/               # Multi-backend caching (memory + Redis)
  permissions/         # RBAC/ABAC authorization
  metering/            # Usage metering + plan limits
  ws/                  # WebSocket server (rooms, presence)
  grpc/                # gRPC service stubs
  i18n/                # Internationalization
  notifications/       # Push notifications (Expo)
  payments/            # Stripe + RevenueCat
  realtime/            # Pusher/Ably realtime
  storage/             # File uploads (UploadThing)
tooling/
  eslint/              # Shared ESLint config
  prettier/            # Shared Prettier config
  tailwind/            # Shared Tailwind config
  typescript/          # Shared tsconfig (strict mode)
  vitest/              # Shared Vitest config
```

## Key Conventions

### TypeScript
- **Strict mode** is on everywhere (`strict: true`, `noUncheckedIndexedAccess: true`)
- Target: ES2022, module: Preserve (bundler resolution)
- Never use `any` — use `unknown` and narrow, or use proper generics
- Never add `// @ts-ignore` or `// @ts-expect-error` without a linked issue
- Prefer `interface` over `type` for object shapes (better error messages)

### Imports
- Use `@gmacko/<package>` for workspace packages — never relative paths across packages
- Use subpath exports where available: `@gmacko/api/openapi`, `@gmacko/db/tenant`
- Prettier auto-sorts imports (configured in `tooling/prettier/index.js`)

### React / Next.js
- App Router only — no Pages Router
- Server Components by default; add `"use client"` only when needed
- Use `next/image` for all images — never raw `<img>` tags
- Use `next/dynamic` for heavy client components that aren't needed at initial render
- Wrap async data-fetching components in `<Suspense>` with Skeleton fallbacks
- Use React Compiler (enabled) — avoid manual `useMemo`/`useCallback` unless profiling shows need
- Partial Pre-rendering is enabled (`ppr: "incremental"`) — use static shells + streaming

### API Layer (tRPC)
- All API routes go through tRPC routers in `packages/api/`
- Use Zod schemas from `@gmacko/validators` for input validation
- Use the `protectedProcedure` for authenticated endpoints
- Use the `orgProcedure` for organization-scoped endpoints
- Structured logging is wired into the tRPC timing middleware

### Database (Drizzle)
- Schema lives in `packages/db/src/schema.ts`
- Migrations: `pnpm db:generate` → `pnpm db:migrate`
- Three driver modes: Neon (serverless), pg (Docker), PGlite (embedded)
- Use `tenantColumns()` / `tenantWhere()` from `@gmacko/db/tenant` for multi-tenant tables
- Query logging is enabled in development via the Drizzle Logger

### Styling
- Tailwind CSS v4 with shared config from `tooling/tailwind/`
- shadcn/ui components in `packages/ui/` — add new ones via `pnpm ui-add`
- Never use inline styles — always Tailwind classes
- Use `cn()` utility for conditional class merging

### Testing
- Unit tests: Vitest (co-located: `foo.ts` → `foo.test.ts`)
- E2E: Playwright for web, Maestro for mobile
- Run before pushing: `pnpm lint && pnpm typecheck && pnpm test`

### Error Handling
- Use `@gmacko/logging` — never raw `console.log` in production code
- Use `@gmacko/monitoring` (Sentry) for error capture
- tRPC procedures should throw `TRPCError` with appropriate codes
- Validate at system boundaries only (user input, webhooks, external APIs)

### Package Design Pattern
All infrastructure packages follow the **factory + adapter** pattern:
```typescript
// Create with sensible defaults, pluggable backend
const cache = createCache({ prefix: "myapp", defaultTTL: 300 });
const limiter = createRateLimiter({ max: 100, window: 60 });
const meter = createMeter({ flushInterval: 60_000, onFlush: sendToStripe });
```
- In-memory store for development, Redis/DB for production
- Optional peer dependencies for heavy libs (ioredis, ws, @grpc/grpc-js)
- Structured logging via `@gmacko/logging` with graceful fallback

### Feature Toggles
- Integration flags live in `packages/config/src/integrations.ts`
- Check flags at boot time, not per-request: `if (integrations.sentry) { ... }`
- New integrations: add a flag, add the `isXEnabled()` helper, update `.env.example`

## Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add user onboarding flow
fix: correct subscription sync on webhook retry
docs: update deployment guide
chore: bump dependencies
refactor: extract pagination utility
test: add unit tests for organization router
```

## Common Commands
```bash
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint && pnpm typecheck && pnpm test   # Pre-push checks
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm e2e:web          # Run Playwright E2E tests
pnpm ui-add           # Add shadcn/ui component
```

## Environment Variables
See `.env.example` for the full list with documentation. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Session encryption key

## Security
- CSP, HSTS, X-Frame-Options, and other headers are set in `next.config.js`
- CORS is configured for `/api/*` routes
- Rate limiting is available via `@gmacko/rate-limit`
- Secret scanning runs via gitleaks in pre-commit hook
- Never commit `.env` files — only `.env.example`

## CI/CD
- GitHub Actions: lint → typecheck → test → build (parallel where possible)
- Changesets for versioning published packages
- Renovate for automated dependency updates
- Docker workflow for containerized deployments

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — Engineering plan review
- `/review` — Code review
- `/ship` — Ship code
- `/browse` — Headless browser for QA and web browsing
- `/qa` — QA testing
- `/qa-only` — QA testing only (no code changes)
- `/setup-browser-cookies` — Set up browser cookies for authenticated browsing
- `/retro` — Retrospective
- `/document-release` — Document a release

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.
