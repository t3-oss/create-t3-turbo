---
name: saas-compliance
description: SOC2 compliance patterns, audit logging, security best practices, and SaaS boilerplate
---

# SaaS Compliance Skill

Build features that meet enterprise-grade security and compliance standards. This skill enforces patterns for SOC2 readiness, comprehensive audit logging, data privacy, and security hardening.

## SOC2 Trust Service Criteria

SOC2 compliance is organized around five trust service criteria. This skill maps each to concrete implementation patterns in the codebase.

### 1. Security (Common Criteria)

#### Authentication & Authorization

```
✓ Better Auth with session management           → packages/auth/
✓ Role-based access control (user, admin)        → packages/db/src/auth-schema.ts
✓ API key authentication with permissions        → packages/api/src/trpc.ts
✓ Session expiration and rotation                → Better Auth config
✓ CSRF protection                                → Better Auth middleware
✓ Password hashing (SHA-256 for API keys)        → packages/api/src/router/settings.ts
```

**Checklist for every new feature:**

- [ ] All mutations require authentication (`protectedProcedure`)
- [ ] Admin-only operations use `adminProcedure`
- [ ] Sensitive operations require re-authentication or confirmation
- [ ] API key permissions are checked for API access
- [ ] Input is validated with Zod before processing
- [ ] SQL injection is prevented (use Drizzle ORM, never raw SQL with user input)
- [ ] XSS is prevented (React's default escaping + no `dangerouslySetInnerHTML`)

#### Secrets Management

```
✓ Environment variables for all secrets          → .env.example
✓ No secrets in source code                      → .gitignore
✓ Separate secrets per environment               → staging vs production
✗ TODO: Secret rotation procedures
✗ TODO: Encrypted secrets at rest (use Vercel/provider secret management)
```

**Rules:**
- NEVER commit `.env` files, API keys, or credentials
- ALWAYS use `process.env` through the validated `env.ts` modules
- ALWAYS use different secrets for development, staging, and production
- ALWAYS document required secrets in `.env.example` with placeholder values

#### Network Security

```
✓ HTTPS enforced (Vercel, Neon SSL)
✓ Trusted origins configured                     → Better Auth config
✓ CORS handled by Next.js / better-auth
✗ TODO: Rate limiting on auth endpoints
✗ TODO: IP allowlisting for admin routes (optional)
```

### 2. Availability

```
✓ Health check endpoints                         → /api/health, /api/health/live, /api/health/ready
✓ Docker health checks                           → docker-compose.yml
✓ Error boundaries (React)                       → error.tsx, global-error.tsx
✓ Sentry error tracking                          → @gmacko/monitoring
✓ Graceful degradation for disabled integrations → @gmacko/config toggle pattern
```

### 3. Processing Integrity

```
✓ Input validation (Zod)                         → Shared validators
✓ Type safety (TypeScript, tRPC)                 → End-to-end types
✓ Database constraints (FK, NOT NULL, unique)    → Drizzle schema
✓ Idempotent operations where possible
```

### 4. Confidentiality

```
✓ Role-based data access
✓ API key scoping (read/write/delete/admin)
✓ Session isolation (users see only their data)
✗ TODO: Data encryption at rest (use Neon's encryption)
✗ TODO: PII masking in logs
```

### 5. Privacy

```
✓ User data deletion (cascade on user delete)
✓ Preference management (user settings)
✗ TODO: Data export (GDPR right to portability)
✗ TODO: Cookie consent banner
✗ TODO: Privacy policy page
```

## Audit Logging

Every compliance-sensitive operation MUST be logged. Use the audit log table:

### Schema

```typescript
// packages/db/src/schema.ts — add this table
export const auditLog = pgTable("audit_log", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  timestamp: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  userId: t.text().references(() => user.id, { onDelete: "set null" }),
  action: t.varchar({ length: 100 }).notNull(), // e.g. "user.create", "post.delete"
  resource: t.varchar({ length: 100 }).notNull(), // e.g. "user", "post", "api_key"
  resourceId: t.varchar({ length: 255 }), // ID of the affected resource
  metadata: t.json().$type<Record<string, unknown>>(), // Additional context
  ipAddress: t.varchar({ length: 45 }),
  userAgent: t.text(),
  status: t.varchar({ length: 20 }).notNull().default("success"), // success, failure, error
}));

// Index for querying by user, action, and time
// CREATE INDEX idx_audit_log_user ON audit_log(user_id, timestamp DESC);
// CREATE INDEX idx_audit_log_action ON audit_log(action, timestamp DESC);
```

### Audit Logger Utility

```typescript
// packages/api/src/lib/audit.ts
import { db } from "@gmacko/db/client";
import { auditLog } from "@gmacko/db/schema";

interface AuditEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "failure" | "error";
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status ?? "success",
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[Audit] Failed to log:", error);
  }
}
```

### What to Audit

| Action | When | Priority |
|--------|------|----------|
| `user.login` | User signs in | Required |
| `user.logout` | User signs out | Required |
| `user.login_failed` | Failed login attempt | Required |
| `user.create` | Account creation | Required |
| `user.delete` | Account deletion | Required |
| `user.role_change` | Role updated (admin) | Required |
| `user.password_change` | Password updated | Required |
| `api_key.create` | API key created | Required |
| `api_key.revoke` | API key revoked | Required |
| `settings.update` | User preferences changed | Recommended |
| `subscription.change` | Plan upgrade/downgrade | Required |
| `subscription.cancel` | Subscription canceled | Required |
| `admin.user_list` | Admin views user list | Recommended |
| `admin.user_update` | Admin modifies user | Required |
| `data.export` | User exports their data | Required |

### Using the Audit Logger in Routers

```typescript
// packages/api/src/router/settings.ts
import { logAudit } from "../lib/audit";

export const settingsRouter = {
  createApiKey: protectedProcedure
    .input(...)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(apiKeys).values({...}).returning();

      await logAudit({
        userId: ctx.session.user.id,
        action: "api_key.create",
        resource: "api_key",
        resourceId: result[0]?.id,
        metadata: { name: input.name, permissions: input.permissions },
      });

      return result;
    }),
};
```

## Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.posthog.com https://*.sentry.io;",
  },
];
```

## Data Retention & Deletion

### User Account Deletion

When a user deletes their account, all their data must be removed:

```typescript
// Schema uses onDelete: "cascade" for all user-related tables:
// - session (cascades)
// - account (cascades)
// - userPreferences (cascades)
// - apiKeys (cascades)
// - subscription (cascades)
// - purchase (cascades)
// - auditLog (set null — keep logs but anonymize)
```

### Session Cleanup

```sql
-- Periodic cleanup of expired sessions (run via cron)
DELETE FROM session WHERE expires_at < NOW() - INTERVAL '30 days';
```

## SOC2 Readiness Checklist

Use this checklist when preparing for SOC2 audit:

### Technical Controls
- [ ] All endpoints require authentication except explicitly public ones
- [ ] Role-based access control enforced
- [ ] Input validation on all user inputs (Zod schemas)
- [ ] Audit logging for all sensitive operations
- [ ] Error monitoring active (Sentry)
- [ ] Health checks configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Secrets stored in environment variables, not code
- [ ] Database connections use SSL
- [ ] API keys are hashed before storage
- [ ] Sessions expire and rotate

### Operational Controls
- [ ] Separate environments (dev, staging, production)
- [ ] Database backups configured (Neon handles this)
- [ ] Incident response via Sentry alerts
- [ ] Change management via git + PR reviews
- [ ] Dependency updates tracked (Renovate/Dependabot)

### Documentation
- [ ] Privacy policy page exists
- [ ] Terms of service page exists
- [ ] API documentation exists
- [ ] Incident response procedure documented
- [ ] Data retention policy documented

## Feature Development Compliance Checklist

Every new feature MUST pass this checklist:

```
□ Input validated with Zod schemas
□ Authentication required for mutations
□ Authorization checked (ownership or role)
□ Audit log entries added for sensitive operations
□ Error cases handled and reported to Sentry
□ No PII in logs (mask emails, hide passwords)
□ Cascade deletion configured for user-owned data
□ SQL injection impossible (Drizzle ORM only)
□ XSS impossible (React escaping, no dangerouslySetInnerHTML)
□ CSRF protection active (Better Auth handles this)
□ Rate limiting considered for public endpoints
```
