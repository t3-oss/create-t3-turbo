import path from "path";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js/driver";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import * as schema from "../schema";

export const createMockDb = async (): Promise<
  PgliteDatabase<typeof schema>
> => {
  const migrationsPath = path.resolve(__dirname, "../../drizzle");
  const db = drizzle({ schema, casing: "snake_case" });

  // Run your actual PostgreSQL migrations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any as PostgresJsDatabase, {
    migrationsFolder: migrationsPath,
  });

  return db;
};
