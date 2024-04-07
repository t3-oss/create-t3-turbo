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

const pushUrl = new URL(`mysql://${credentials.host}/${credentials.database}`);
pushUrl.username = credentials.username;
pushUrl.password = credentials.password;
pushUrl.searchParams.set("ssl", '{"rejectUnauthorized":true}');

export default {
  schema: "./src/schema",
  driver: "mysql2",
  dbCredentials: { uri: pushUrl.href },
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
