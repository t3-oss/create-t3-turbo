import type { Config } from "drizzle-kit";
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

const env = createEnv({
  server: {
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const credentials = {
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  host: env.DB_HOST,
  database: env.DB_NAME,
};

export default {
  schema: "./src/schema",
  driver: "mysql2",
  dbCredentials: credentials,
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
