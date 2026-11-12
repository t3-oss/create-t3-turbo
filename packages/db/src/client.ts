import { sql } from "@vercel/postgres";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Local Docker Postgres speaks TCP, while @vercel/postgres uses Neon WebSockets.
// Production keeps the existing Vercel Postgres client.
const isProduction = process.env.NODE_ENV === "production";
const isLocalPostgres =
  process.env.POSTGRES_URL?.includes("localhost") === true;

export const db =
  isProduction && !isLocalPostgres
    ? drizzleVercel({ client: sql, schema, casing: "snake_case" })
    : drizzleNode({
        client: new Pool({ connectionString: process.env.POSTGRES_URL }),
        schema,
        casing: "snake_case",
      });
