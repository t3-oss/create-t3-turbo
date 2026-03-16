import type { Logger as DrizzleLogger } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Structured Drizzle query logger.
 * Uses @gmacko/logging when available, falls back to console.
 */
class QueryLogger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    const start = performance.now();
    // We can't measure actual execution time from logQuery alone,
    // but we log the query for traceability. The logging package's
    // logDbQuery() is available for instrumented paths.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createLogger } = require("@gmacko/logging") as {
        createLogger: (ctx?: Record<string, unknown>) => {
          debug: (obj: Record<string, unknown>, msg: string) => void;
        };
      };
      const logger = createLogger({ component: "database" });
      logger.debug(
        {
          query: query.substring(0, 500),
          params: params.length,
          durationMs: Math.round((performance.now() - start) * 100) / 100,
        },
        "DB query",
      );
    } catch {
      // Logging package not available — silent in production
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[DB] ${query.substring(0, 200)}`);
      }
    }
  }
}

const queryLogger =
  process.env.NODE_ENV !== "production" ? new QueryLogger() : undefined;

function createDb() {
  // PGlite local mode: use embedded PostgreSQL (no server needed)
  if (process.env.DATABASE_DRIVER === "pglite") {
    // Dynamic import so PGlite is not bundled in production
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db: localDb } = require("./client-local") as {
      db: ReturnType<typeof drizzlePg>;
    };
    return localDb;
  }

  // Docker-compose local mode: standard PostgreSQL connection
  if (process.env.DATABASE_DRIVER === "pg") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pg = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return pg.drizzle({
      client: pool,
      schema,
      casing: "snake_case",
      logger: queryLogger,
    });
  }

  // Default: Neon serverless (production / staging)
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const sql = neon(process.env.DATABASE_URL);
  return drizzlePg({
    client: sql,
    schema,
    casing: "snake_case",
    logger: queryLogger,
  });
}

export const db = createDb();
