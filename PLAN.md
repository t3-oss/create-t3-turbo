# Implementation Plan: Template Improvements & Package Extraction

## Phase 1: Performance Quick Wins

### 1a. Fix `next.config.js`
- **Remove** `typescript: { ignoreBuildErrors: true }` — masks real issues
- **Add** `experimental.reactCompiler: true` — automatic memoization (Next.js 16 + React 19)
- **Add** `experimental.ppr: 'incremental'` — Partial Pre-rendering for static shells + streaming

### 1b. Static pages
- Legal pages (`/privacy`, `/terms`, `/cookies`) call `new Date()` at render time, making them dynamic. Convert to static by computing the date at build time or hardcoding it. Add `export const dynamic = 'force-static'` to these pages.

### 1c. Expand Suspense boundaries
- Audit pages with data fetching and wrap slow queries in `<Suspense fallback={...}>` so the shell renders immediately.
- Key candidates: settings pages, admin pages, billing page.

### 1d. Image optimization
- Search for raw `<img>` tags and replace with `next/image` (`Image` component) for automatic WebP, responsive sizing, lazy loading.

### 1e. Dynamic imports for heavy components
- Identify heavy client components (settings panels, billing forms, admin tables) and lazy-load them with `next/dynamic`.

---

## Phase 2: Structured Logging (Wire It Up)

### 2a. AsyncLocalStorage context propagation
- Create `packages/logging/src/context.ts` with `AsyncLocalStorage<LogContext>` for request-scoped context
- Export `withRequestContext(ctx, fn)` and `getRequestContext()` helpers
- The logger automatically reads from ALS when no explicit context is passed

### 2b. Replace `console.log` in tRPC timing middleware
- In `packages/api/src/trpc.ts`, replace `console.log(\`[TRPC] ${path} took...\`)` with the structured logger
- Pull `requestId` from the tRPC context headers and log it
- Add `userId` from session to the log context

### 2c. Drizzle query instrumentation
- In `packages/db/src/client.ts`, wrap the Drizzle instance with a `.logger` option that calls `logDbQuery()` from `@gmacko/logging`
- This gives automatic slow query detection with zero code changes in routers

### 2d. Wire request logging into API routes
- Create a tRPC middleware that uses `createRequestLoggingHandler()` to log every API request with structured fields

---

## Phase 3: Audit Logging Package

### New package: `packages/audit/`

- **Table**: `audit_log` (id, actor_id, actor_type, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at)
- **Functions**: `auditLog(event)` — writes to DB + emits structured log
- **tRPC middleware**: Auto-log admin mutations (user ban, impersonation, role changes)
- **Actions tracked**: auth events, admin actions, billing changes, data exports, API key operations
- **Query helpers**: `getAuditLog(filters)` for admin dashboard

---

## Phase 4: Rate Limiting Package

### New package: `packages/rate-limit/`

- **Strategy**: Sliding window, token bucket
- **Backends**: In-memory (dev/single-instance) + Redis (production/multi-instance)
- **Integration**: tRPC middleware — `rateLimitedProcedure({ limit: 100, window: '1m' })`
- **Key types**: Per-user, per-IP, per-API-key
- **Response headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Configuration**: Per-route overrides, plan-based limits (free/starter/pro/enterprise)

---

## Phase 5: Command Palette (cmdk)

### Add to `packages/ui/`

- **Library**: `cmdk` (already standard for shadcn)
- **Components**: `CommandPalette`, `CommandGroup`, `CommandItem`
- **Keyboard shortcut**: `Cmd+K` / `Ctrl+K`
- **Default groups**: Navigation, Settings, Theme toggle, Recent pages
- **Extensible**: Apps register their own commands via context provider
- **Integration**: Wire into Next.js app layout

---

## Phase 6: Webhook Delivery System

### New package: `packages/webhooks/`

- **Database tables**: `webhook_endpoint` (URL, secret, events, active), `webhook_delivery` (endpoint_id, event, payload, status, attempts, response_code, next_retry_at)
- **Delivery**: Async via background jobs queue (`@gmacko/jobs`)
- **Security**: HMAC-SHA256 signatures (like Stripe's `Stripe-Signature`)
- **Retry**: Exponential backoff (1m, 5m, 30m, 2h, 24h), max 5 attempts
- **Events**: Configurable event types per endpoint
- **Admin UI data**: Query helpers for delivery status dashboard
- **tRPC router**: CRUD for webhook endpoints, delivery log viewing

---

## Phase 7: Multi-tenancy Data Isolation

### Additions to `packages/db/`

- **Row-level scoping**: Helper `withTenantScope(query, orgId)` that automatically adds `WHERE org_id = ?`
- **tRPC middleware**: `orgScopedProcedure` that injects `orgId` into context and validates membership
- **Schema helpers**: `tenantColumns()` that adds `org_id` + index to any table definition
- **Migration guide**: Document how to add `org_id` to existing tables

---

## Phase 8: Package Extraction Strategy

### Tier 1: Ready to extract now (zero @gmacko/* dependencies, generic infrastructure)

| Current Package | Standalone Name | Why |
|---|---|---|
| `@gmacko/logging` | `@gmacko/saas-logger` | Pure Pino wrapper + Sentry integration. Only depends on `@gmacko/config` for a boolean flag — trivially decoupled. |
| `@gmacko/monitoring` | `@gmacko/saas-monitoring` | Sentry initialization wrappers. Config flag is the only internal dep. |
| `@gmacko/analytics` | `@gmacko/saas-analytics` | PostHog wrappers. Same pattern. |
| `@gmacko/flags` | `@gmacko/feature-flags` | Self-contained runtime flag system. No DB dependency. |
| `packages/rate-limit` (new) | `@gmacko/rate-limit` | Born standalone. |

### Tier 2: Extract with adapter pattern (light internal dependencies)

| Current Package | Strategy |
|---|---|
| `@gmacko/email` | Extract template engine + sending logic. Accept provider config as constructor arg instead of reading from `@gmacko/config`. |
| `@gmacko/realtime` | Same — provider config as constructor arg. |
| `@gmacko/storage` | Same — provider config as constructor arg. |
| `@gmacko/jobs` | Extract queue engine. DB-backed option needs a generic "store" interface instead of importing `@gmacko/db`. |
| `packages/audit` (new) | Born with adapter pattern — accept DB instance as arg. |
| `packages/webhooks` (new) | Born with adapter pattern. |

### Tier 3: Stay in-project (too coupled to project schema)

| Package | Why |
|---|---|
| `@gmacko/db` | Project-specific schema, migrations, seed data |
| `@gmacko/auth` | Depends on DB schema, project-specific OAuth config |
| `@gmacko/api` | Project-specific routers, depends on DB + auth |
| `@gmacko/settings` | Depends on DB schema |
| `@gmacko/payments` | Depends on DB schema + project-specific plans |
| `@gmacko/notifications` | Expo-specific, tied to app config |
| `@gmacko/config` | Project-specific integration flags — but should become a *pattern* (template for new projects) |
| `@gmacko/validators` | Project-specific Zod schemas |
| `@gmacko/ui` | shadcn components — already extractable via shadcn CLI; no need for a separate package |

### Extraction Implementation Pattern

For each Tier 1/2 package:

1. **Add a `config` constructor** — replace `import { integrations } from "@gmacko/config"` with a `createXxx(config)` factory
2. **Publish to npm** under `@gmacko/` scope (or a new scope like `@saas-kit/`)
3. **In the monorepo template**, replace the local package with a dependency on the published version
4. **Keep the monorepo workspace entry** as a thin re-export so existing imports don't break
5. **Versioning**: Use changesets (already set up) for independent versioning
