import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@acme/db/client";

/**
 * Only options that affect the database schema are needed here.
 *
 * For example, the "username" plugin requires schema migration.
 * @see https://www.better-auth.com/docs/plugins/username#migrate-the-database
 */
export const baseConfig = {
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [
    /* Add plugins that require schema migration here */
  ],
} satisfies BetterAuthOptions;

/** Configuration used by `@better-auth/cli` to run `generate`
 * @see https://github.com/better-auth/better-auth/blob/40d514f7ed7c4179d769984f42487e2672b16e6a/packages/cli/src/utils/get-config.ts#L178
 */
export const auth = { options: baseConfig };
