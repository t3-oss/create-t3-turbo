import type { Config } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

import { Posts, Users } from "./collections";
import { env } from "./env";

// necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

const payloadConfig = {
  cors: "*",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Posts],
  secret: env.PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
  }),
  plugins: [
    // storage-adapter-placeholder
  ],
} satisfies Config;

const config = buildConfig(payloadConfig);
export default config;
