import { sql } from "@vercel/postgres";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleServerless } from "drizzle-orm/vercel-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL env var is not set");
}

const postgresUrl = new URL(connectionString);
const host = postgresUrl.hostname.toLowerCase();
const isLocalConnection =
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const nonPoolingConnectionString =
  process.env.POSTGRES_URL_NON_POOLING ?? connectionString;

export const db = isLocalConnection
  ? drizzleNode(new Pool({ connectionString: nonPoolingConnectionString }), {
      schema,
      casing: "camelCase",
    })
  : drizzleServerless({
      client: sql,
      schema,
      casing: "camelCase",
    });
