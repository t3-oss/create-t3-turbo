import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/neon-http";

import * as schema from "./schema";

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
    return pg.drizzle({ client: pool, schema, casing: "snake_case" });
  }

  // Default: Neon serverless (production / staging)
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const sql = neon(process.env.DATABASE_URL);
  return drizzlePg({ client: sql, schema, casing: "snake_case" });
}

export const db = createDb();
