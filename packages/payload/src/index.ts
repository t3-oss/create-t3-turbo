import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import dotenv from "dotenv";
import { buildConfig, getPayload } from "payload";
import sharp from "sharp";

import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

// this is necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
dotenv.config({
  path: path.resolve(dirname, "../../../.env"),
});

export const config = buildConfig({
  cors: "*",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Posts],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || "",
    },
  }),
  routes: {
    admin: "/",
  },
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
});
// Get a local copy of Payload by passing your config
const payload = await getPayload({ config });

export default payload;
