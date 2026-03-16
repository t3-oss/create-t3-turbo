import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config for local PGlite development.
 *
 * Usage:
 *   pnpm db:push:local   — push schema to local PGlite database
 *   pnpm db:studio:local  — open Drizzle Studio for local database
 */
export default {
  schema: ["./src/schema.ts", "./src/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/gmacko_dev",
  },
  casing: "snake_case",
} satisfies Config;
