import { index, pgTable } from "drizzle-orm/pg-core";

export const userRoleEnum = ["user", "admin"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const user = pgTable("user", (t) => ({
  id: t.text().primaryKey(),
  name: t.text().notNull(),
  email: t.text().notNull().unique(),
  emailVerified: t.boolean().notNull(),
  image: t.text(),
  role: t.text().$type<UserRole>().notNull().default("user"),
  createdAt: t.timestamp().notNull(),
  updatedAt: t.timestamp().notNull(),
}));

export const session = pgTable("session", (t) => ({
  id: t.text().primaryKey(),
  expiresAt: t.timestamp().notNull(),
  token: t.text().notNull().unique(),
  createdAt: t.timestamp().notNull(),
  updatedAt: t.timestamp().notNull(),
  ipAddress: t.text(),
  userAgent: t.text(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}));

export const account = pgTable("account", (t) => ({
  id: t.text().primaryKey(),
  accountId: t.text().notNull(),
  providerId: t.text().notNull(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: t.text(),
  refreshToken: t.text(),
  idToken: t.text(),
  accessTokenExpiresAt: t.timestamp(),
  refreshTokenExpiresAt: t.timestamp(),
  scope: t.text(),
  password: t.text(),
  createdAt: t.timestamp().notNull(),
  updatedAt: t.timestamp().notNull(),
}));

export const verification = pgTable("verification", (t) => ({
  id: t.text().primaryKey(),
  identifier: t.text().notNull(),
  value: t.text().notNull(),
  expiresAt: t.timestamp().notNull(),
  createdAt: t.timestamp(),
  updatedAt: t.timestamp(),
}));

export const deviceCodeStatusEnum = ["pending", "approved", "denied"] as const;
export type DeviceCodeStatus = (typeof deviceCodeStatusEnum)[number];

// RFC 8628 device-authorization grant (better-auth `deviceAuthorization`
// plugin). Backs mobile QR pairing and user-code device sign-in. deviceCode
// and userCode are single-use credentials the plugin looks up on every poll
// and approval — unique gives correctness AND the index for those hot paths.
export const deviceCode = pgTable("device_code", (t) => ({
  id: t.text().primaryKey(),
  deviceCode: t.text().notNull().unique(),
  userCode: t.text().notNull().unique(),
  userId: t.text().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: t.timestamp().notNull(),
  status: t.text().$type<DeviceCodeStatus>().notNull(),
  lastPolledAt: t.timestamp(),
  pollingInterval: t.integer(),
  clientId: t.text(),
  scope: t.text(),
}));

// Bring-your-own SSO identity providers (better-auth `sso` plugin), registered
// at runtime by platform admins and matched to sign-ins by email domain.
// oidcConfig/samlConfig are JSON strings managed by the plugin. userId is the
// registering admin — set null on deletion so removing that admin's account
// doesn't lock the whole email domain out of SSO.
export const ssoProvider = pgTable(
  "sso_provider",
  (t) => ({
    id: t.text().primaryKey(),
    issuer: t.text().notNull(),
    oidcConfig: t.text(),
    samlConfig: t.text(),
    userId: t.text().references(() => user.id, { onDelete: "set null" }),
    providerId: t.text().notNull().unique(),
    organizationId: t.text(),
    domain: t.text().notNull(),
  }),
  (table) => [index("sso_provider_domain_idx").on(table.domain)],
);
