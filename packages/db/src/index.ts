import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import { connectionStr } from "./config";
import * as auth from "./schema/auth";
import * as post from "./schema/post";

export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/mysql-core";

export const schema = { ...auth, ...post };

const psClient = new Client({ url: connectionStr.href });
export const db = drizzle(psClient, { schema });
