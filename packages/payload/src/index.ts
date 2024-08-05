import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig, getPayload } from "payload";
import { loadEnv } from "payload/node";

import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

// this is necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

loadEnv(); // can only run in a node environemnt!

export const config = buildConfig({
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
});
// Get a local copy of Payload by passing your config
const payload = await getPayload({ config });

export default payload;
