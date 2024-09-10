import path from "path";
import { fileURLToPath } from "url";
import type { Config } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";

import { Accounts, Admins, Customers, Posts, Sessions } from "./collections";
import { env } from "./env";

// necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const payloadConfig = {
  cors: "*",
  admin: {
    user: Admins.slug,
  },
  collections: [Admins, Posts, Customers, Sessions, Accounts],
  secret: env.PAYLOAD_SECRET,
  db: postgresAdapter({
    idType: "uuid",
    pool: {
      connectionString: env.DATABASE_URI,
    },
  }),
  plugins: [
    // storage-adapter-placeholder
  ],
  typescript: {
    autoGenerate: env.NODE_ENV === "development",
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
} satisfies Config;

const config = buildConfig(payloadConfig);
export default config;
