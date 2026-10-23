import { existsSync } from "node:fs";
import { join } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

// Bun only auto-loads `.env` from the process cwd, which for
// `pnpm nx run @acme/server:*` is `apps/server` — so pull the repo-root
// `.env` in explicitly. Skipped when absent (CI/Docker inject variables
// directly).
const rootEnvFile = join(import.meta.dir, "../../../.env");
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).optional(),
    PORT: z.coerce.number().default(3000),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    AUTH_SECRET: z.string().min(1),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
    DATABASE_URL: z.string().min(1).default("./sqlite.db"),
  },
  runtimeEnv: process.env,
});
