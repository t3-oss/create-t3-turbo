import { defineConfig, NodeSqliteDialect, SqliteDriver } from "@mikro-orm/sql";

import { Post } from "./src/entities/post";

export default defineConfig({
  driver: SqliteDriver,
  driverOptions: () =>
    new NodeSqliteDialect(process.env.DATABASE_URL ?? "./sqlite.db"),
  entities: [Post],
  dbName: process.env.DATABASE_URL ?? "./sqlite.db",
  migrations: { path: "./src/migrations", pathTs: "./src/migrations" },
});
