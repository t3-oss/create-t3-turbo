---
name: saas-compliance
description: SOC2 compliance patterns, audit logging, security best practices, SAML/SSO, and SaaS boilerplate
---

# SaaS Compliance Skill

Build features that meet enterprise-grade security and compliance standards. This skill enforces patterns for SOC2 readiness, comprehensive audit logging, data privacy, SAML/SSO, and security hardening.

## SOC2 Trust Service Criteria

SOC2 compliance is organized around five trust service criteria. This skill maps each to concrete implementation patterns in the codebase.

### 1. Security (Common Criteria)

#### Authentication & Authorization

```
✓ Better Auth with session management           → packages/auth/
✓ Role-based access control (user, admin)        → packages/db/src/auth-schema.ts
✓ API key authentication with permissions        → packages/api/src/trpc.ts
✓ Session expiration and rotation (7-day)        → Better Auth config
✓ CSRF protection                                → Better Auth middleware
✓ TOTP two-factor authentication                 → Better Auth twoFactor plugin
✓ Admin impersonation (audited)                  → Better Auth admin plugin
✓ Organization/team multi-tenancy                → Better Auth organization plugin
✓ Account linking across providers               → Better Auth accountLinking
✓ Email verification required in production      → Better Auth emailAndPassword
✓ Password policy (8-128 chars)                  → Better Auth config
✓ Social providers (Discord, Google, GitHub, MS) → packages/auth/src/index.ts
✓ SAML/SSO enterprise integration               → packages/auth/src/enterprise.ts
```

**Checklist for every new feature:**

- [ ] All mutations require authentication (`protectedProcedure`)
- [ ] Admin-only operations use `adminProcedure`
- [ ] Sensitive operations require re-authentication or confirmation
- [ ] API key permissions are checked for API access
- [ ] Input is validated with Zod before processing
- [ ] SQL injection is prevented (use Drizzle ORM, never raw SQL with user input)
- [ ] XSS is prevented (React's default escaping + no `dangerouslySetInnerHTML`)

#### Enterprise SSO / SAML

For enterprise customers requiring SAML 2.0 SSO:

```typescript
// packages/auth/src/enterprise.ts provides:
// - SamlIdpConfig / SamlSpConfig types
// - getSpConfig(baseUrl) → SP metadata to share with customer
// - IDP_PRESETS.okta / azureAd / googleWorkspace / onelogin
// - validateIdpMetadata(url) → validates an IdP metadata URL

// packages/db/src/schema.ts provides:
// - ssoConnection table (per-organization IdP configuration)
// - Stores: idpEntityId, idpSsoUrl, idpCertificate, domains, enforced flag
```

**SSO Setup Flow:**
1. Enterprise customer sends their IdP metadata URL
2. Admin creates an `ssoConnection` record for their organization
3. Set `enforced: true` to require SSO for that org's email domains
4. Users from those domains authenticate through the corporate IdP
5. Better Auth handles assertion parsing and session creation

#### Secrets Management

```
✓ Environment variables for all secrets          → .env.example
✓ No secrets in source code                      → .gitignore
✓ Separate secrets per environment               → staging vs production
✓ Secret validation via Zod (env.ts)             → @t3-oss/env-nextjs
```

**Rules:**
- NEVER commit `.env` files, API keys, or credentials
- ALWAYS use `process.env` through the validated `env.ts` modules
- ALWAYS use different secrets for development, staging, and production
- ALWAYS document required secrets in `.env.example` with placeholder values

#### Network Security

```
✓ HTTPS enforced (HSTS with 2-year max-age)     → next.config.js
✓ Content Security Policy (CSP)                  → next.config.js
✓ X-Frame-Options: DENY                          → next.config.js
✓ X-Content-Type-Options: nosniff                → next.config.js
✓ Strict Referrer-Policy                         → next.config.js
✓ Permissions-Policy (no camera/mic/geo)         → next.config.js
✓ CORS with configurable origins                 → next.config.js / trpc route
✓ Rate limiting (public/auth/sensitive/API)      → packages/api/src/middleware/rate-limit.ts
✓ X-Request-ID tracing                           → apps/nextjs/src/middleware.ts
```

### 2. Availability

```
✓ Health check endpoints                         → /api/health, /api/health/live, /api/health/ready
✓ Docker health checks                           → docker-compose.yml
✓ Error boundaries (React)                       → @gmacko/ui/error-boundary
✓ Sentry error tracking                          → @gmacko/monitoring
✓ Graceful degradation for disabled integrations → @gmacko/config toggle pattern
✓ Background job queue with retry                → @gmacko/jobs
✓ Cron endpoint for job processing               → /api/cron/jobs
```

### 3. Processing Integrity

```
✓ Input validation (Zod)                         → Shared validators
✓ Type safety (TypeScript, tRPC)                 → End-to-end types
✓ Database constraints (FK, NOT NULL, unique)    → Drizzle schema
✓ Stripe webhook signature verification          → /api/webhooks/stripe
✓ Idempotent operations where possible
```

### 4. Confidentiality

```
✓ Role-based data access (user/admin/org roles)
✓ API key scoping (read/write/delete/admin)
✓ Session isolation (users see only their data)
✓ Organization-scoped data access
✓ PII redaction in structured logs               → @gmacko/logging (pino redact)
✓ API key hashing (SHA-256)                      → packages/api/src/trpc.ts
```

### 5. Privacy

```
✓ User data deletion (cascade on user delete)    → Drizzle schema
✓ Data export (JSON, GDPR portability)           → account.exportData endpoint
✓ Account deletion with confirmation             → account.deleteAccount endpoint
✓ Preference management (user settings)          → settings router
✓ Privacy policy page                            → /privacy
✓ Terms of service page                          → /terms
✓ Cookie policy page                             → /cookies
✓ Audit log anonymization (set null on delete)   → auditLog schema
```

## Audit Logging

Every compliance-sensitive operation MUST be logged. The audit system is implemented:

### Components

- **Schema:** `auditLog` table in `packages/db/src/schema.ts`
- **Logger:** `logAudit()` + `AUDIT_ACTIONS` in `packages/api/src/lib/audit.ts`

### Usage

```typescript
import { logAudit, AUDIT_ACTIONS } from "../lib/audit";

// In a tRPC mutation:
export const settingsRouter = {
  createApiKey: protectedProcedure
    .input(...)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(apiKeys).values({...}).returning();

      await logAudit({
        userId: ctx.session.user.id,
        action: AUDIT_ACTIONS.API_KEY_CREATE,
        resource: "api_key",
        resourceId: result[0]?.id,
        metadata: { name: input.name, permissions: input.permissions },
      });

      return result;
    }),
};
```

### What to Audit

| Action | Constant | Priority |
|--------|----------|----------|
| User login | `USER_LOGIN` | Required |
| Failed login | `USER_LOGIN_FAILED` | Required |
| User signup | `USER_SIGNUP` | Required |
| Account deletion | `USER_DELETE` | Required |
| Role change | `USER_ROLE_CHANGE` | Required |
| Password change | `USER_PASSWORD_CHANGE` | Required |
| 2FA enable/disable | `USER_2FA_ENABLE/DISABLE` | Required |
| API key create | `API_KEY_CREATE` | Required |
| API key revoke | `API_KEY_REVOKE` | Required |
| Subscription change | `SUBSCRIPTION_CHANGE` | Required |
| Subscription cancel | `SUBSCRIPTION_CANCEL` | Required |
| Org member invite | `ORG_MEMBER_INVITE` | Required |
| Org member remove | `ORG_MEMBER_REMOVE` | Required |
| SSO connection create | `SSO_CREATE` | Required |
| SSO login | `SSO_LOGIN` | Required |
| Data export | `DATA_EXPORT` | Required |
| Admin user update | `ADMIN_USER_UPDATE` | Required |
| Admin impersonate | `ADMIN_IMPERSONATE` | Required |
| Settings update | `SETTINGS_UPDATE` | Recommended |

## Rate Limiting

Use the pre-configured rate limiters from `packages/api/src/middleware/rate-limit.ts`:

```typescript
import { rateLimits } from "../middleware/rate-limit";

// Apply to a procedure
export const myRouter = {
  sensitiveAction: publicProcedure
    .use(rateLimits.sensitive) // 5 req/min
    .mutation(...),

  publicQuery: publicProcedure
    .use(rateLimits.public) // 30 req/min
    .query(...),
};
```

| Tier | Limit | Use For |
|------|-------|---------|
| `public` | 30/min | Public read endpoints |
| `authenticated` | 60/min | Standard authenticated actions |
| `sensitive` | 5/min | Login, signup, password reset |
| `apiKey` | 120/min | API key-authenticated requests |

## Data Retention & Deletion

### User Account Deletion

When a user deletes their account, all data is removed via cascade:

```
session          → CASCADE (deleted)
account          → CASCADE (deleted)
userPreferences  → CASCADE (deleted)
apiKeys          → CASCADE (deleted)
subscription     → CASCADE (deleted)
purchase         → CASCADE (deleted)
orgMembership    → CASCADE (deleted)
auditLog         → SET NULL (kept, anonymized)
```

### Data Export

```typescript
// Users can export all their data via:
const data = await trpc.account.exportData.query();
// Returns: { user, preferences, subscriptions, purchases, posts, apiKeys }
```

### Session Cleanup

```sql
-- Periodic cleanup of expired sessions (run via cron)
DELETE FROM session WHERE expires_at < NOW() - INTERVAL '30 days';
```

## SOC2 Readiness Checklist

### Technical Controls
- [ ] All endpoints require authentication except explicitly public ones
- [ ] RBAC enforced (user/admin/org roles)
- [ ] Input validation on all user inputs (Zod schemas)
- [ ] Audit logging for all sensitive operations
- [ ] Error monitoring active (Sentry)
- [ ] Health checks configured (/api/health)
- [ ] HTTPS enforced (HSTS header)
- [ ] CSP header configured
- [ ] Security headers configured (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Rate limiting on auth and sensitive endpoints
- [ ] Secrets stored in environment variables, not code
- [ ] Database connections use SSL
- [ ] API keys are hashed before storage
- [ ] Sessions expire and rotate
- [ ] 2FA available (TOTP)
- [ ] SSO/SAML available for enterprise
- [ ] X-Request-ID tracing enabled

### Operational Controls
- [ ] Separate environments (dev, staging, production)
- [ ] Database backups configured (Neon handles this)
- [ ] Incident response via Sentry alerts
- [ ] Change management via git + PR reviews
- [ ] Dependency updates tracked (Renovate/Dependabot)
- [ ] Background job processing with retry and dead-letter

### Legal & Documentation
- [ ] Privacy policy page exists (/privacy)
- [ ] Terms of service page exists (/terms)
- [ ] Cookie policy page exists (/cookies)
- [ ] API documentation exists (OpenAPI spec)
- [ ] Data export available to users
- [ ] Account deletion available to users
- [ ] Incident response procedure documented
- [ ] Data retention policy documented

## Feature Development Compliance Checklist

Every new feature MUST pass this checklist:

```
□ Input validated with Zod schemas
□ Authentication required for mutations
□ Authorization checked (ownership or role)
□ Audit log entries added for sensitive operations (use AUDIT_ACTIONS)
□ Error cases handled and reported to Sentry
□ No PII in logs (use @gmacko/logging with pino redact)
□ Cascade deletion configured for user-owned data
□ SQL injection impossible (Drizzle ORM only)
□ XSS impossible (React escaping, no dangerouslySetInnerHTML)
□ CSRF protection active (Better Auth handles this)
□ Rate limiting applied to public/sensitive endpoints
□ Data export includes new data types
□ Account deletion cascades new tables
```
