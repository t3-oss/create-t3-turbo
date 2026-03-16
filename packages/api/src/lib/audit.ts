import { db } from "@gmacko/db/client";
import { auditLog } from "@gmacko/db/schema";

export interface AuditEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a compliance-sensitive action to the audit trail.
 *
 * This never throws — audit logging must not break the main flow.
 *
 * @example
 * ```ts
 * await logAudit({
 *   userId: ctx.session.user.id,
 *   action: "api_key.create",
 *   resource: "api_key",
 *   resourceId: key.id,
 *   metadata: { name: input.name },
 * });
 * ```
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId,
      organizationId: entry.organizationId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("[Audit] Failed to log:", error);
  }
}

/**
 * Standard audit action names.
 * Use these constants for consistency across the codebase.
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_SIGNUP: "user.signup",
  USER_DELETE: "user.delete",
  USER_ROLE_CHANGE: "user.role_change",
  USER_PASSWORD_CHANGE: "user.password_change",
  USER_EMAIL_CHANGE: "user.email_change",
  USER_2FA_ENABLE: "user.2fa_enable",
  USER_2FA_DISABLE: "user.2fa_disable",

  // API Keys
  API_KEY_CREATE: "api_key.create",
  API_KEY_REVOKE: "api_key.revoke",

  // Settings
  SETTINGS_UPDATE: "settings.update",

  // Billing
  SUBSCRIPTION_CREATE: "subscription.create",
  SUBSCRIPTION_CHANGE: "subscription.change",
  SUBSCRIPTION_CANCEL: "subscription.cancel",

  // Organization
  ORG_CREATE: "organization.create",
  ORG_UPDATE: "organization.update",
  ORG_DELETE: "organization.delete",
  ORG_MEMBER_INVITE: "organization.member_invite",
  ORG_MEMBER_JOIN: "organization.member_join",
  ORG_MEMBER_REMOVE: "organization.member_remove",
  ORG_MEMBER_ROLE_CHANGE: "organization.member_role_change",

  // SSO
  SSO_CREATE: "sso.connection_create",
  SSO_UPDATE: "sso.connection_update",
  SSO_DELETE: "sso.connection_delete",
  SSO_LOGIN: "sso.login",

  // Data
  DATA_EXPORT: "data.export",
  DATA_DELETE: "data.delete",

  // Admin
  ADMIN_USER_VIEW: "admin.user_view",
  ADMIN_USER_UPDATE: "admin.user_update",
  ADMIN_IMPERSONATE: "admin.impersonate",
} as const;
