import { Client } from "@planetscale/database";
import { createEnv } from "@t3-oss/env-core";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { z } from "zod";

import * as schema from "./schema";

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

export const getConnectionString = () => {
  // Push requires SSL so use URL instead of username/password
  const connectionStr = new URL(`mysql://${env.DB_HOST}/${env.DB_NAME}`);
  connectionStr.username = env.DB_USERNAME;
  connectionStr.password = env.DB_PASSWORD;
  connectionStr.searchParams.set("ssl", '{"rejectUnauthorized":true}');

  return connectionStr.href;
};

export const createDBClient = () => {
  const psClient = new Client({ url: getConnectionString() });
  return drizzle(psClient, { schema });
};
