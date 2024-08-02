import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import dotenv from "dotenv";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
dotenv.config();

export default buildConfig({
  cors: "*",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Posts],
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
