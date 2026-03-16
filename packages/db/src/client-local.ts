/**
 * Local development database client using PGlite.
 *
 * PGlite is an embedded PostgreSQL that runs in-process — no Docker or
 * external server required. It's fully PostgreSQL-compatible so the same
 * Drizzle pgTable schemas work without any changes.
 *
 * Usage:
 *   DATABASE_DRIVER=pglite pnpm dev
 *
 * The database is persisted to .local/pglite by default, or use
 * DATABASE_URL=memory:// for a purely in-memory instance (great for tests).
 */
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

import * as schema from "./schema";

const dataDir = process.env.PGLITE_DATA_DIR ?? ".local/pglite";

const client = new PGlite(
  process.env.DATABASE_URL === "memory://" ? undefined : dataDir,
);

export const db = drizzle({
  client,
  schema,
  casing: "snake_case",
});
