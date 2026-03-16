/**
 * @gmacko/db/tenant — Multi-tenancy Data Isolation Helpers
 *
 * Provides utilities for row-level tenant scoping in a multi-tenant SaaS.
 * Works with Drizzle ORM and the existing organization schema.
 *
 * Usage in tRPC routers:
 *   import { withTenantScope, tenantColumns } from "@gmacko/db/tenant";
 *
 *   // Query with automatic org scoping
 *   const posts = await withTenantScope(
 *     db.select().from(Post),
 *     Post.organizationId,
 *     ctx.organizationId,
 *   );
 *
 *   // Add tenant columns to a new table
 *   export const Project = pgTable("project", (t) => ({
 *     id: t.uuid().notNull().primaryKey().defaultRandom(),
 *     name: t.varchar({ length: 256 }).notNull(),
 *     ...tenantColumns(t),
 *   }));
 */

import type { Column, SQL } from "drizzle-orm";
import { eq, and } from "drizzle-orm";
import type { PgColumn, PgTableExtraConfigValue } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";

import { organization } from "./schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TenantContext {
  /** The organization ID for the current request */
  organizationId: string;
  /** The user's role within the organization */
  role?: string;
}

// ─── Schema Helpers ──────────────────────────────────────────────────────────

/**
 * Add standard tenant columns to a table definition.
 * Adds `organizationId` with a foreign key to the organization table.
 *
 * Usage:
 *   export const Project = pgTable("project", (t) => ({
 *     id: t.uuid().notNull().primaryKey().defaultRandom(),
 *     ...tenantColumns(t),
 *     name: t.varchar({ length: 256 }).notNull(),
 *   }));
 */
export function tenantColumns(t: {
  uuid: () => {
    notNull: () => {
      references: (
        fn: () => PgColumn,
        opts: { onDelete: string },
      ) => unknown;
    };
  };
}) {
  return {
    organizationId: t
      .uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  } as const;
}

/**
 * Create an index on the organizationId column for a tenant-scoped table.
 * Use this in a table's extra config.
 *
 * Usage:
 *   export const Project = pgTable("project", (t) => ({
 *     ...
 *   }), (table) => [tenantIndex(table.organizationId)]);
 */
export function tenantIndex(
  orgIdColumn: PgColumn,
): PgTableExtraConfigValue {
  return index().on(orgIdColumn);
}

// ─── Query Helpers ───────────────────────────────────────────────────────────

/**
 * Apply tenant scoping to a Drizzle query by adding a WHERE clause
 * that filters by organizationId.
 *
 * Works with select, update, and delete queries.
 *
 * @param orgIdColumn - The organizationId column on the target table
 * @param organizationId - The tenant's organization ID
 * @returns A SQL condition to AND with other conditions
 *
 * Usage:
 *   const projects = await db
 *     .select()
 *     .from(Project)
 *     .where(tenantWhere(Project.organizationId, ctx.organizationId));
 */
export function tenantWhere(
  orgIdColumn: Column,
  organizationId: string,
): SQL {
  return eq(orgIdColumn, organizationId);
}

/**
 * Combine a tenant scope with additional query conditions.
 *
 * Usage:
 *   const activeProjects = await db
 *     .select()
 *     .from(Project)
 *     .where(tenantAnd(
 *       Project.organizationId,
 *       ctx.organizationId,
 *       eq(Project.status, "active"),
 *     ));
 */
export function tenantAnd(
  orgIdColumn: Column,
  organizationId: string,
  ...conditions: (SQL | undefined)[]
): SQL {
  return and(
    tenantWhere(orgIdColumn, organizationId),
    ...conditions,
  )!;
}

/**
 * Validate that a user belongs to the specified organization.
 * Throws if the user is not a member.
 */
export async function validateOrgMembership(
  db: {
    select: () => {
      from: (table: unknown) => {
        where: (condition: SQL) => {
          limit: (n: number) => Promise<unknown[]>;
        };
      };
    };
  },
  organizationMemberTable: {
    organizationId: Column;
    userId: Column;
  },
  organizationId: string,
  userId: string,
): Promise<void> {
  const [member] = await db
    .select()
    .from(organizationMemberTable)
    .where(
      and(
        eq(organizationMemberTable.organizationId, organizationId),
        eq(organizationMemberTable.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new Error("User is not a member of this organization");
  }
}
