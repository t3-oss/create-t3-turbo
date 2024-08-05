import type { Config } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

// this is necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

const payloadConfig = {
  cors: "*",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Posts],
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || "",
    },
  }),
  routes: {
    admin: "/",
  },
  plugins: [
    // storage-adapter-placeholder
  ],
} satisfies Config;

export const config = buildConfig(payloadConfig);

// const payload = await getPayload({ config });
// export default payload;
