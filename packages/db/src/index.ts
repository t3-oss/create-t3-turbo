import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import { connectionStr } from "./config";
import { schema } from "./schema";

export { mySqlTable as tableCreator } from "./schema/_table";

export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/mysql-core";

const psClient = new Client({ url: connectionStr.href });

export const db = drizzle(psClient, { schema });
