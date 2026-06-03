# Architecture & Conventions

This document describes the system architecture, design decisions, and conventions
used across all products built from the create-gmacko-app template.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                             │
│   Next.js (Web)  ·  Expo (Mobile)  ·  SDK / External API   │
└───────────┬─────────────────┬────────────────┬──────────────┘
            │                 │                │
            ▼                 ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Edge / Middleware                        │
│   Rate Limiting · Maintenance Mode · i18n · Request Tracing │
└───────────┬─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (tRPC)                        │
│   Auth Guard · Input Validation · Timing · Audit Logging    │
└───────────┬────────────────┬────────────────┬───────────────┘
            │                │                │
            ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│  PostgreSQL  │  │    Redis     │  │   External Services  │
│  (Drizzle)   │  │  (Cache/RL)  │  │  Stripe · Sentry ·   │
│              │  │              │  │  PostHog · Email      │
└──────────────┘  └──────────────┘  └──────────────────────┘
```

## Design Principles

1. **Convention over configuration** — The template ships with sensible defaults.
   Override via `packages/config/src/integrations.ts` flags, not scattered env checks.

2. **Monorepo-first, extract later** — All code starts in the monorepo. Infrastructure
   packages are designed with the adapter pattern so they can be extracted to standalone
   npm packages when they prove stable. See `docs/PACKAGE_EXTRACTION.md`.

3. **Server Components by default** — Use React Server Components for data fetching.
   Client components (`"use client"`) are used only for interactivity. Heavy client
   components are loaded with `next/dynamic`.

4. **Type safety end-to-end** — TypeScript strict mode, Zod validation at boundaries,
   tRPC for type-safe API calls, Drizzle for type-safe SQL.

5. **Observable by default** — Structured logging (Pino), error tracking (Sentry),
   analytics (PostHog), request tracing (X-Request-ID), metrics collection.

6. **Security by default** — CSP headers, HSTS, rate limiting, HMAC webhook signatures,
   gitleaks secret scanning, RBAC/ABAC authorization.

## Package Dependency Rules

```
tooling/*          → No workspace deps (standalone config packages)
packages/config    → No workspace deps (leaf node)
packages/logging   → @gmacko/config
packages/db        → @gmacko/config
packages/auth      → @gmacko/db, @gmacko/config
packages/api       → @gmacko/auth, @gmacko/db, @gmacko/config, @gmacko/logging, @gmacko/validators
packages/ui        → No workspace deps (standalone components)
apps/*             → Can depend on any package
```

Infrastructure packages (`cache`, `rate-limit`, `permissions`, `metering`, `ws`, `grpc`)
have zero or optional workspace dependencies — they're designed for extraction.

## Data Flow Patterns

### Request Lifecycle
1. Middleware: generate `X-Request-ID`, check maintenance mode, apply i18n
2. tRPC: authenticate session, validate input (Zod), execute procedure
3. Procedure: business logic, DB queries (Drizzle), side effects
4. Timing middleware: log duration, flag slow queries (>3s)
5. Response: serialize (SuperJSON), set cache headers

### Background Jobs
1. Enqueue via `@gmacko/jobs` (in-memory queue or cron endpoint)
2. `/api/cron/jobs` route processes the queue (protected by `CRON_SECRET`)
3. Job handlers run with structured logging context

### Webhook Delivery
1. Event occurs → `sendWebhook()` signs payload with HMAC-SHA256
2. Delivery attempt with exponential backoff: 60s, 5m, 30m, 2h, 24h
3. Delivery status tracked for monitoring

## Multi-Tenancy Model

- Organizations are the primary tenant boundary
- `tenantColumns()` adds `organizationId` FK to tables
- `tenantWhere()` / `tenantAnd()` enforce tenant isolation in queries
- `validateOrgMembership()` guards cross-tenant access at the API layer

## Authentication & Authorization

### Authentication (Better Auth)
- Session-based with secure cookies
- Social OAuth: Discord, Google, GitHub, Microsoft
- Enterprise SAML 2.0 (optional)
- Email/password with verification

### Authorization (RBAC/ABAC)
- Roles → Permissions mapping via `@gmacko/permissions`
- Wildcard support: `"project.*"` matches `"project.read"`, `"project.write"`
- Ownership-based: `"own"` permission checks `resource.ownerId === user.id`
- Organization-scoped: roles can differ per organization

## Environment Strategy

| Environment | Database | Feature Flags | Monitoring |
|------------|----------|---------------|------------|
| Development | PGlite (embedded) | All enabled | Debug logging |
| Preview | Neon branch | Production flags | Sentry (staging) |
| Staging | Neon staging DB | Production flags | Full observability |
| Production | Neon production DB | Controlled rollout | Full observability |

## ADR: Key Decisions

### ADR-001: tRPC over REST
- **Context**: Need type-safe API communication between Next.js and React Native
- **Decision**: Use tRPC with SuperJSON serialization
- **Consequence**: Full type inference, no codegen needed, OpenAPI spec generated separately

### ADR-002: Drizzle over Prisma
- **Context**: Need a TypeScript ORM with good serverless support
- **Decision**: Use Drizzle ORM with Neon serverless driver
- **Consequence**: SQL-like API, better query performance, native edge runtime support

### ADR-003: Better Auth over NextAuth
- **Context**: Need auth that works across Next.js and Expo
- **Decision**: Use Better Auth for framework-agnostic authentication
- **Consequence**: Single auth config shared across platforms, SAML/enterprise support

### ADR-004: Factory + Adapter Pattern for Infrastructure
- **Context**: Infrastructure packages need to work in dev (no Redis/services) and prod
- **Decision**: All packages use `createX(config, store?)` with in-memory defaults
- **Consequence**: Zero-config dev experience, pluggable backends for production

### ADR-005: Monorepo with Turborepo
- **Context**: Multiple apps sharing code, need fast builds
- **Decision**: Turborepo with pnpm workspaces
- **Consequence**: Incremental builds, remote caching, shared tooling configs
