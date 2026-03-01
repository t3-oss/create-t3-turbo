import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const userPreferences = pgTable("user_preferences", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  theme: t.varchar({ length: 20 }).notNull().default("system"),
  language: t.varchar({ length: 10 }).notNull().default("en"),
  timezone: t.varchar({ length: 50 }).notNull().default("UTC"),
  emailNotifications: t.boolean().notNull().default(true),
  pushNotifications: t.boolean().notNull().default(true),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const apiKeys = pgTable("api_keys", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: t.varchar({ length: 100 }).notNull(),
  keyHash: t.text().notNull(),
  keyPrefix: t.varchar({ length: 12 }).notNull(),
  permissions: t.json().$type<string[]>().notNull().default(["read"]),
  lastUsedAt: t.timestamp({ mode: "date", withTimezone: true }),
  expiresAt: t.timestamp({ mode: "date", withTimezone: true }),
  createdAt: t.timestamp().defaultNow().notNull(),
  revokedAt: t.timestamp({ mode: "date", withTimezone: true }),
}));

export const CreateUserPreferencesSchema = createInsertSchema(userPreferences, {
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().max(10).default("en"),
  timezone: z.string().max(50).default("UTC"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserPreferencesSchema =
  CreateUserPreferencesSchema.partial().omit({
    userId: true,
  });

// ─── Subscription / Billing ────────────────────────────────────────────────

export const subscriptionPlanEnum = [
  "free",
  "starter",
  "pro",
  "enterprise",
] as const;
export type SubscriptionPlan = (typeof subscriptionPlanEnum)[number];

export const subscriptionStatusEnum = [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "paused",
  "incomplete",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatusEnum)[number];

export const subscription = pgTable("subscription", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: t.varchar({ length: 255 }),
  stripeSubscriptionId: t.varchar({ length: 255 }),
  stripePriceId: t.varchar({ length: 255 }),
  plan: t
    .varchar({ length: 20 })
    .$type<SubscriptionPlan>()
    .notNull()
    .default("free"),
  status: t
    .varchar({ length: 20 })
    .$type<SubscriptionStatus>()
    .notNull()
    .default("active"),
  currentPeriodStart: t.timestamp({ mode: "date", withTimezone: true }),
  currentPeriodEnd: t.timestamp({ mode: "date", withTimezone: true }),
  cancelAtPeriodEnd: t.boolean().notNull().default(false),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateSubscriptionSchema = createInsertSchema(subscription).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Purchase / One-Time Payment ───────────────────────────────────────────

export const purchase = pgTable("purchase", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  stripePaymentIntentId: t.varchar({ length: 255 }),
  stripeProductId: t.varchar({ length: 255 }),
  amount: t.integer().notNull(),
  currency: t.varchar({ length: 3 }).notNull().default("usd"),
  status: t.varchar({ length: 20 }).notNull().default("succeeded"),
  metadata: t.json().$type<Record<string, string>>(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// ─── Organizations / Multi-Tenancy ──────────────────────────────────────────

export const organizationRoleEnum = [
  "owner",
  "admin",
  "member",
] as const;
export type OrganizationRole = (typeof organizationRoleEnum)[number];

export const organization = pgTable("organization", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 256 }).notNull(),
  slug: t.varchar({ length: 256 }).notNull().unique(),
  logo: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const organizationMember = pgTable("organization_member", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  organizationId: t
    .uuid()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: t
    .varchar({ length: 20 })
    .$type<OrganizationRole>()
    .notNull()
    .default("member"),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const organizationInvite = pgTable("organization_invite", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  organizationId: t
    .uuid()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: t.varchar({ length: 256 }).notNull(),
  role: t
    .varchar({ length: 20 })
    .$type<OrganizationRole>()
    .notNull()
    .default("member"),
  invitedBy: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: t.text().notNull().unique(),
  expiresAt: t.timestamp({ mode: "date", withTimezone: true }).notNull(),
  acceptedAt: t.timestamp({ mode: "date", withTimezone: true }),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// ─── In-App Notifications ────────────────────────────────────────────────────

export const notificationTypeEnum = [
  "info",
  "success",
  "warning",
  "error",
] as const;
export type NotificationType = (typeof notificationTypeEnum)[number];

export const notification = pgTable("notification", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: t
    .varchar({ length: 20 })
    .$type<NotificationType>()
    .notNull()
    .default("info"),
  title: t.varchar({ length: 256 }).notNull(),
  body: t.text().notNull(),
  /** Optional link to navigate to when clicked */
  href: t.text(),
  read: t.boolean().notNull().default(false),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

// ─── SSO / SAML Connections (Enterprise) ────────────────────────────────────

export const ssoConnection = pgTable("sso_connection", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  organizationId: t
    .uuid()
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  provider: t.varchar({ length: 50 }).notNull().default("saml"),
  /** IdP Entity ID */
  idpEntityId: t.text().notNull(),
  /** IdP SSO URL (redirect target) */
  idpSsoUrl: t.text().notNull(),
  /** IdP X.509 certificate (PEM) for signature verification */
  idpCertificate: t.text().notNull(),
  /** IdP metadata URL (for auto-refresh) */
  idpMetadataUrl: t.text(),
  /** IdP Single Logout URL */
  idpSloUrl: t.text(),
  /** Whether this connection is active */
  enabled: t.boolean().notNull().default(true),
  /** Whether to enforce SSO (block email/password login for this org's domain) */
  enforced: t.boolean().notNull().default(false),
  /** Email domains that map to this SSO connection (e.g., ["acme.com"]) */
  domains: t.json().$type<string[]>().notNull().default([]),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

// ─── Audit Log (SOC2 Compliance) ────────────────────────────────────────────

export const auditLog = pgTable("audit_log", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t.text().references(() => user.id, { onDelete: "set null" }),
  organizationId: t
    .uuid()
    .references(() => organization.id, { onDelete: "set null" }),
  action: t.varchar({ length: 100 }).notNull(),
  resource: t.varchar({ length: 100 }).notNull(),
  resourceId: t.text(),
  metadata: t.json().$type<Record<string, unknown>>(),
  ipAddress: t.varchar({ length: 45 }),
  userAgent: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export * from "./auth-schema";
