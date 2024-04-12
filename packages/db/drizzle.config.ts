import type { Config } from "drizzle-kit";

import { getConnectionString } from "./src/client";

export default {
  schema: "./src/schema",
  driver: "mysql2",
  dbCredentials: { uri: getConnectionString() },
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
