/**
 * Database Seeding Script
 *
 * Seeds the database with default admin/test accounts and sample data.
 * Run with: pnpm --filter @gmacko/db seed
 *
 * Default Accounts:
 *   Admin:  admin@example.com / admin123
 *   Test:   test@example.com  / test123
 *
 * This script is idempotent - it clears existing seed data before inserting.
 */

import { createHash, randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";

import { db } from "./client";
import {
  account,
  apiKeys,
  Post,
  subscription,
  user,
  userPreferences,
} from "./schema";

// ─── Fixed Seed IDs (makes seeding idempotent) ────────────────────────────

const SEED_USER_IDS = {
  admin: "seed_admin_001",
  test: "seed_test_002",
  alice: "seed_user_alice_003",
  bob: "seed_user_bob_004",
} as const;

const ALL_SEED_IDS = Object.values(SEED_USER_IDS);

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// ─── Default Accounts ──────────────────────────────────────────────────────

const defaultAccounts = [
  {
    id: SEED_USER_IDS.admin,
    name: "Admin User",
    email: "admin@example.com",
    emailVerified: true,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    role: "admin" as const,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: SEED_USER_IDS.test,
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    role: "user" as const,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  },
  {
    id: SEED_USER_IDS.alice,
    name: "Alice Johnson",
    email: "alice@example.com",
    emailVerified: true,
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    role: "user" as const,
    createdAt: new Date("2024-02-20T14:30:00Z"),
    updatedAt: new Date("2024-02-20T14:30:00Z"),
  },
  {
    id: SEED_USER_IDS.bob,
    name: "Bob Smith",
    email: "bob@example.com",
    emailVerified: false,
    image: null,
    role: "user" as const,
    createdAt: new Date("2024-03-10T09:15:00Z"),
    updatedAt: new Date("2024-03-10T09:15:00Z"),
  },
];

// Credential accounts for email/password login (Better Auth compatible)
const credentialAccounts = [
  {
    id: `acct_${SEED_USER_IDS.admin}`,
    accountId: SEED_USER_IDS.admin,
    providerId: "credential",
    userId: SEED_USER_IDS.admin,
    password: hashPassword("admin123"),
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: `acct_${SEED_USER_IDS.test}`,
    accountId: SEED_USER_IDS.test,
    providerId: "credential",
    userId: SEED_USER_IDS.test,
    password: hashPassword("test123"),
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  },
];

// ─── Subscriptions ─────────────────────────────────────────────────────────

const sampleSubscriptions = [
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.admin,
    stripeCustomerId: "cus_seed_admin",
    stripeSubscriptionId: "sub_seed_admin",
    stripePriceId: "price_pro_monthly",
    plan: "pro" as const,
    status: "active" as const,
    currentPeriodStart: new Date("2024-01-01T00:00:00Z"),
    currentPeriodEnd: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.test,
    stripeCustomerId: "cus_seed_test",
    stripeSubscriptionId: null,
    stripePriceId: null,
    plan: "free" as const,
    status: "active" as const,
    currentPeriodStart: new Date("2024-01-15T00:00:00Z"),
    currentPeriodEnd: null,
  },
];

// ─── Sample Content ────────────────────────────────────────────────────────

const samplePosts = [
  {
    id: randomUUID(),
    title: "Getting Started with Drizzle ORM",
    content:
      "Drizzle ORM is a TypeScript-first ORM that provides type-safe database access. In this post, we explore the basics of setting up Drizzle with Neon Postgres and creating your first schema.",
  },
  {
    id: randomUUID(),
    title: "Building a Monorepo with Turborepo",
    content:
      "Turborepo makes managing monorepos a breeze. Learn how to structure your packages, configure caching, and speed up your builds with this comprehensive guide.",
  },
  {
    id: randomUUID(),
    title: "Type-Safe APIs with tRPC",
    content:
      "tRPC enables end-to-end type safety between your client and server. Discover how to define procedures, handle errors, and integrate with React Query for seamless data fetching.",
  },
  {
    id: randomUUID(),
    title: "Authentication with Better Auth",
    content:
      "Better Auth provides a flexible authentication solution for modern web applications. This tutorial covers setting up OAuth providers, session management, and securing your routes.",
  },
  {
    id: randomUUID(),
    title: "Deploying to Vercel and Neon",
    content:
      "Learn the best practices for deploying your Next.js application to Vercel with a Neon Postgres database. We cover environment variables, connection pooling, and performance optimization.",
  },
];

const samplePreferences = [
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.admin,
    theme: "dark" as const,
    language: "en",
    timezone: "America/New_York",
    emailNotifications: true,
    pushNotifications: true,
  },
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.test,
    theme: "system" as const,
    language: "en",
    timezone: "UTC",
    emailNotifications: true,
    pushNotifications: true,
  },
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.alice,
    theme: "light" as const,
    language: "es",
    timezone: "Europe/Madrid",
    emailNotifications: true,
    pushNotifications: false,
  },
];

const sampleApiKeys = [
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.admin,
    name: "Admin Development Key",
    keyHash: createHash("sha256").update("gmk_admin_dev_key_seed").digest("hex"),
    keyPrefix: "gmk_admin_d",
    permissions: ["read", "write", "delete", "admin"],
    expiresAt: null,
  },
  {
    id: randomUUID(),
    userId: SEED_USER_IDS.test,
    name: "Test Read-Only Key",
    keyHash: createHash("sha256").update("gmk_test_readonly_seed").digest("hex"),
    keyPrefix: "gmk_test_ro",
    permissions: ["read"],
    expiresAt: new Date("2026-12-31T23:59:59Z"),
  },
];

// ─── Seed Functions ────────────────────────────────────────────────────────

async function clearSeedData() {
  console.log("Clearing existing seed data...");

  await db.delete(apiKeys).where(inArray(apiKeys.userId, ALL_SEED_IDS));
  await db
    .delete(userPreferences)
    .where(inArray(userPreferences.userId, ALL_SEED_IDS));
  await db
    .delete(subscription)
    .where(inArray(subscription.userId, ALL_SEED_IDS));
  await db.delete(account).where(inArray(account.userId, ALL_SEED_IDS));
  await db.delete(user).where(inArray(user.id, ALL_SEED_IDS));

  for (const post of samplePosts) {
    await db.delete(Post).where(eq(Post.title, post.title));
  }

  console.log("Seed data cleared.");
}

async function seedUsers() {
  console.log("Seeding users...");
  await db.insert(user).values(defaultAccounts);
  console.log(`  Inserted ${defaultAccounts.length} users`);
  console.log("  Default accounts:");
  console.log("    Admin: admin@example.com / admin123");
  console.log("    Test:  test@example.com  / test123");
}

async function seedCredentialAccounts() {
  console.log("Seeding credential accounts...");
  await db.insert(account).values(credentialAccounts);
  console.log(`  Inserted ${credentialAccounts.length} credential accounts`);
}

async function seedSubscriptions() {
  console.log("Seeding subscriptions...");
  await db.insert(subscription).values(sampleSubscriptions);
  console.log(`  Inserted ${sampleSubscriptions.length} subscriptions`);
}

async function seedPosts() {
  console.log("Seeding posts...");
  await db.insert(Post).values(samplePosts);
  console.log(`  Inserted ${samplePosts.length} posts`);
}

async function seedUserPreferences() {
  console.log("Seeding user preferences...");
  await db.insert(userPreferences).values(samplePreferences);
  console.log(`  Inserted ${samplePreferences.length} user preferences`);
}

async function seedApiKeys() {
  console.log("Seeding API keys...");
  await db.insert(apiKeys).values(sampleApiKeys);
  console.log(`  Inserted ${sampleApiKeys.length} API keys`);
  console.log("  Known test keys:");
  console.log("    Admin key: gmk_admin_dev_key_seed");
  console.log("    Test key:  gmk_test_readonly_seed");
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("========================================");
  console.log("  Database Seed Script");
  console.log("========================================\n");

  try {
    await clearSeedData();
    await seedUsers();
    await seedCredentialAccounts();
    await seedSubscriptions();
    await seedPosts();
    await seedUserPreferences();
    await seedApiKeys();

    console.log("\n========================================");
    console.log("  Seeding Complete!");
    console.log("========================================");
    console.log(`  Users:          ${defaultAccounts.length}`);
    console.log(`  Subscriptions:  ${sampleSubscriptions.length}`);
    console.log(`  Posts:          ${samplePosts.length}`);
    console.log(`  Preferences:    ${samplePreferences.length}`);
    console.log(`  API Keys:       ${sampleApiKeys.length}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
