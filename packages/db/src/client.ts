import { sql } from "@vercel/postgres";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const localPostgresHosts = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "postgres",
]);
const isLocalPostgres = (() => {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) return false;
  try {
    return localPostgresHosts.has(new URL(connectionString).hostname);
  } catch {
    return false;
  }
})();

export const db = isLocalPostgres
  ? drizzleNode({
      client: new Pool({ connectionString: process.env.POSTGRES_URL }),
      schema,
      casing: "snake_case",
    })
  : drizzleVercel({ client: sql, schema, casing: "snake_case" });
