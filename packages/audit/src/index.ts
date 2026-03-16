/**
 * @gmacko/audit — Structured Audit Logging
 *
 * Records security-relevant and compliance-critical events to the audit_log
 * database table. Every event is also emitted via the structured logger
 * for real-time observability.
 *
 * Usage:
 *   import { audit, queryAuditLog } from "@gmacko/audit";
 *
 *   await audit({
 *     action: "user.role.updated",
 *     actorId: adminUser.id,
 *     resource: "user",
 *     resourceId: targetUser.id,
 *     metadata: { oldRole: "user", newRole: "admin" },
 *     ipAddress: request.ip,
 *   });
 */

import { desc, eq, and, gte, lte, sql } from "drizzle-orm";

import { db } from "@gmacko/db/client";
import { auditLog } from "@gmacko/db/schema";
import { createLogger } from "@gmacko/logging";

const logger = createLogger({ component: "audit" });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
  /** The action performed (e.g., "user.role.updated", "api_key.created") */
  action: string;
  /** The user or system that performed the action */
  actorId?: string;
  /** Organization context (for multi-tenant actions) */
  organizationId?: string;
  /** The resource type being acted upon (e.g., "user", "api_key", "subscription") */
  resource: string;
  /** The specific resource identifier */
  resourceId?: string;
  /** Additional structured data about the event */
  metadata?: Record<string, unknown>;
  /** IP address of the actor */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
}

export interface AuditQueryOptions {
  /** Filter by actor */
  actorId?: string;
  /** Filter by organization */
  organizationId?: string;
  /** Filter by action prefix (e.g., "user." matches "user.role.updated") */
  actionPrefix?: string;
  /** Filter by resource type */
  resource?: string;
  /** Filter by resource ID */
  resourceId?: string;
  /** Start of time range */
  after?: Date;
  /** End of time range */
  before?: Date;
  /** Max results (default 50, max 500) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ─── Pre-defined Actions ─────────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  // Authentication
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_PASSWORD_CHANGED: "auth.password_changed",
  AUTH_2FA_ENABLED: "auth.2fa_enabled",
  AUTH_2FA_DISABLED: "auth.2fa_disabled",

  // User management
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_ROLE_UPDATED: "user.role.updated",
  USER_BANNED: "user.banned",
  USER_UNBANNED: "user.unbanned",
  USER_IMPERSONATED: "user.impersonated",

  // API keys
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",

  // Billing
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",

  // Organization
  ORG_CREATED: "organization.created",
  ORG_MEMBER_INVITED: "organization.member.invited",
  ORG_MEMBER_REMOVED: "organization.member.removed",
  ORG_MEMBER_ROLE_CHANGED: "organization.member.role_changed",
  ORG_SSO_CONFIGURED: "organization.sso.configured",

  // Data
  DATA_EXPORTED: "data.exported",
  DATA_DELETED: "data.deleted",

  // Settings
  SETTINGS_UPDATED: "settings.updated",
} as const;

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Record an audit event.
 * Writes to the database and emits a structured log entry.
 */
export async function audit(event: AuditEvent): Promise<string> {
  const [record] = await db
    .insert(auditLog)
    .values({
      userId: event.actorId,
      organizationId: event.organizationId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    })
    .returning({ id: auditLog.id });

  logger.info(
    {
      auditId: record!.id,
      action: event.action,
      actorId: event.actorId,
      resource: event.resource,
      resourceId: event.resourceId,
      organizationId: event.organizationId,
    },
    `Audit: ${event.action}`,
  );

  return record!.id;
}

/**
 * Query the audit log with filtering and pagination.
 */
export async function queryAuditLog(options: AuditQueryOptions = {}) {
  const limit = Math.min(options.limit ?? 50, 500);
  const offset = options.offset ?? 0;

  const conditions = [];

  if (options.actorId) {
    conditions.push(eq(auditLog.userId, options.actorId));
  }
  if (options.organizationId) {
    conditions.push(eq(auditLog.organizationId, options.organizationId));
  }
  if (options.actionPrefix) {
    conditions.push(
      sql`${auditLog.action} LIKE ${options.actionPrefix + "%"}`,
    );
  }
  if (options.resource) {
    conditions.push(eq(auditLog.resource, options.resource));
  }
  if (options.resourceId) {
    conditions.push(eq(auditLog.resourceId, options.resourceId));
  }
  if (options.after) {
    conditions.push(gte(auditLog.createdAt, options.after));
  }
  if (options.before) {
    conditions.push(lte(auditLog.createdAt, options.before));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(auditLog)
      .where(where),
  ]);

  return {
    entries,
    total: Number(countResult[0]?.count ?? 0),
    limit,
    offset,
  };
}

/**
 * Get a summary of audit activity for a time period.
 */
export async function getAuditSummary(
  since: Date,
  organizationId?: string,
) {
  const conditions = [gte(auditLog.createdAt, since)];
  if (organizationId) {
    conditions.push(eq(auditLog.organizationId, organizationId));
  }

  const results = await db
    .select({
      action: auditLog.action,
      count: sql<number>`count(*)`,
    })
    .from(auditLog)
    .where(and(...conditions))
    .groupBy(auditLog.action)
    .orderBy(desc(sql`count(*)`));

  return results.map((r) => ({
    action: r.action,
    count: Number(r.count),
  }));
}
