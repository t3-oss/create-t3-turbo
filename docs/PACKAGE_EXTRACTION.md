# Package Extraction Strategy

This document details which `@gmacko/*` packages should be extracted into
standalone npm packages, the order in which to do it, and the exact steps
for each.

## Why Extract?

Extracted packages give us:
- **Reuse across projects** — install from npm instead of copy-pasting
- **Independent versioning** — fix a bug in logging without releasing the
  whole template
- **Smaller template footprint** — new projects start lighter
- **Community contributions** — standalone packages are easier to contribute to

## Extraction Tiers

### Tier 1: Extract Now (zero project-specific coupling)

These packages have no dependency on project-specific schema, config, or
business logic. They import `@gmacko/config` only for a boolean flag that
can be replaced with a constructor argument.

| Package | Standalone Name | Current Deps | Decoupling Work |
|---------|----------------|--------------|-----------------|
| `@gmacko/logging` | `@gmacko/saas-logger` | `@gmacko/config` (for `integrations.sentry` flag) | Replace with `createLogger({ sentry: boolean })` factory. Move ALS context to a subpath export. |
| `@gmacko/monitoring` | `@gmacko/saas-monitoring` | `@gmacko/config` (for `integrations.sentry` flag) | Replace with `initSentry({ enabled: boolean, ...config })` factory. |
| `@gmacko/analytics` | `@gmacko/saas-analytics` | `@gmacko/config` (for `integrations.posthog` flag) | Replace with `initAnalytics({ enabled: boolean, ...config })` factory. |
| `@gmacko/flags` | `@gmacko/feature-flags` | None (only React as peer dep) | Already standalone. Just publish. |
| `@gmacko/rate-limit` | `@gmacko/rate-limit` | None (ioredis as optional peer) | Born standalone. Publish as-is. |
| `@gmacko/cache` | `@gmacko/cache` | None (ioredis as optional peer) | Born standalone. Publish as-is. In-memory + Redis store pattern. |
| `@gmacko/permissions` | `@gmacko/permissions` | None | Pure logic, no external deps. Publish as-is. |
| `@gmacko/metrics` | `@gmacko/metrics` | None (prom-client as optional peer) | Born standalone. In-memory fallback + Prometheus integration. Publish as-is. |

**Extraction Steps (per package):**

```
1. Create a new repo: github.com/gmackorg/<package-name>
2. Copy src/, package.json, tsconfig.json
3. Replace `import { integrations } from "@gmacko/config"` with a config
   parameter on the factory function
4. Add README, LICENSE, CHANGELOG
5. Set up changesets for versioning
6. Publish to npm under @gmacko/ scope
7. In the monorepo template, replace the workspace dependency:
     "@gmacko/logging": "workspace:*"  →  "@gmacko/saas-logger": "^1.0.0"
8. Keep the workspace package as a thin re-export wrapper:
     // packages/logging/src/index.ts
     export * from "@gmacko/saas-logger";
     export { createLogger } from "@gmacko/saas-logger";
   This preserves all existing import paths.
```

### Tier 2: Extract with Adapter Pattern (light coupling)

These packages import project internals but can be decoupled by accepting
a store/provider interface instead of importing it directly.

| Package | Coupling Point | Adapter Strategy |
|---------|---------------|-----------------|
| `@gmacko/email` | `@gmacko/config` for provider flag | Accept `{ provider: "resend" \| "sendgrid", apiKey: string }` in constructor. Templates stay in the package (they're generic SaaS emails). |
| `@gmacko/realtime` | `@gmacko/config` for provider flag | Accept `{ provider: "pusher" \| "ably", ...credentials }` in constructor. |
| `@gmacko/storage` | `@gmacko/config` for provider flag | Accept `{ provider: "uploadthing", token: string }` in constructor. |
| `@gmacko/jobs` | None (in-memory only) | Already standalone. For the DB-backed option, accept a generic `JobStore` interface. |
| `@gmacko/audit` | `@gmacko/db` for the audit_log table | Accept a generic `AuditStore` interface: `{ insert(event): Promise<string>, query(filters): Promise<AuditEntry[]> }`. Ship a Drizzle adapter. |
| `@gmacko/webhooks` | `@gmacko/jobs` for delivery, `@gmacko/logging` | Accept a `{ enqueue(type, payload): Promise<string> }` interface. The logging dependency is already optional (falls back to console). |
| `@gmacko/metering` | `@gmacko/logging` | Accept a generic `UsageStore` interface. Ship with in-memory default. Stripe integration via `onFlush` callback. |
| `@gmacko/ws` | `@gmacko/logging`, `ws` (optional peer) | Accept a logger interface. The `ws` package is already optional with graceful fallback. |
| `@gmacko/grpc` | `@gmacko/logging`, `@grpc/grpc-js` (optional peer) | Accept a logger interface. Proto-loader and grpc-js are already optional peers. |

**Extraction Steps (per package):**

```
1. Define the adapter interface (e.g., AuditStore, JobStore)
2. Create a default in-memory implementation
3. Create a Drizzle/Redis/etc adapter as a separate export:
     import { DrizzleAuditStore } from "@gmacko/audit/drizzle"
4. The factory function accepts the store:
     const audit = createAuditLogger({ store: new DrizzleAuditStore(db) })
5. Publish, then update the monorepo to use the published version
```

### Tier 3: Stay In-Project (too coupled to project schema)

These packages are inherently project-specific. Extracting them would
create more complexity than value.

| Package | Why It Stays |
|---------|-------------|
| `@gmacko/db` | Project-specific schema, migrations, seed data. Every project's schema is different. |
| `@gmacko/auth` | Depends on DB schema tables (user, session, account). OAuth provider config is project-specific. |
| `@gmacko/api` | Project-specific tRPC routers with business logic. |
| `@gmacko/settings` | Depends on project-specific user_preferences schema. |
| `@gmacko/payments` | Depends on project-specific subscription plans and pricing. |
| `@gmacko/notifications` | Expo-specific, tied to app.config.ts EAS project IDs. |
| `@gmacko/config` | Project-specific integration flags. However, the *pattern* (a typed integrations object) should be documented as a best practice. |
| `@gmacko/validators` | Project-specific Zod schemas for API contracts. |
| `@gmacko/ui` | shadcn components are already individually installable via `npx shadcn add`. No need for a separate package. |
| `@gmacko/i18n` | Message files are project-specific. The wiring (next-intl + i18next) is too thin to warrant a package. |
| `@gmacko/mcp-server` | Bridges to project-specific tRPC routers. Already published to npm as a CLI tool. |

## Extraction Priority Order

1. **`@gmacko/rate-limit`** — Born standalone, zero deps, highest standalone value
2. **`@gmacko/cache`** — Born standalone, in-memory + Redis, universal need
3. **`@gmacko/permissions`** — Pure logic, zero deps, every app needs RBAC
4. **`@gmacko/metrics`** — Born standalone, Prometheus + in-memory, every service needs metrics
5. **`@gmacko/feature-flags`** — Already standalone, just needs publishing
6. **`@gmacko/saas-logger`** — High reuse, single config flag to decouple
7. **`@gmacko/saas-monitoring`** — Same pattern as logger, pairs well
8. **`@gmacko/saas-analytics`** — Same pattern, completes the observability trio
9. **`@gmacko/jobs`** — Generic queue pattern, useful everywhere
10. **`@gmacko/metering`** — Usage-based billing is common in B2B SaaS
11. **`@gmacko/email`** — SaaS email templates are universal
12. **`@gmacko/webhooks`** — Webhook delivery is a common SaaS need
13. **`@gmacko/ws`** — WebSocket server with rooms/auth, useful for collaborative features
14. **`@gmacko/grpc`** — gRPC stubs for microservice communication
15. **`@gmacko/audit`** — Audit logging is compliance-critical, benefits from standardization

## Versioning Strategy

- Use **changesets** (already configured in the monorepo)
- Each extracted package gets independent semver
- Breaking changes require a major bump
- The monorepo template pins to `^major.minor` for stability
- CI/CD publishes on merge to main via the existing `release.yml` workflow

## Migration Checklist (per package)

- [ ] Decouple from `@gmacko/config` (replace with constructor config)
- [ ] Add comprehensive JSDoc and README
- [ ] Add unit tests (vitest, use existing `@gmacko/vitest-config`)
- [ ] Set `"private": false` in package.json
- [ ] Add `"publishConfig": { "access": "public" }`
- [ ] Add `"files": ["dist", "src"]` for published package
- [ ] Test with `pnpm pack` locally before publishing
- [ ] Update monorepo template to use published version
- [ ] Add thin re-export wrapper in monorepo for backward compatibility
- [ ] Update CLAUDE.md / README with new import paths
