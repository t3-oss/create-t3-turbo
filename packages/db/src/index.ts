import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

import * as auth from "./schema/auth";
import * as post from "./schema/post";

export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/mysql-core";

export const schema = { ...auth, ...post };

export const db = drizzle(sql, { schema });
