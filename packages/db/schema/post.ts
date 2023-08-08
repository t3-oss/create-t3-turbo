import {
  mysqlTableCreator,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { mySqlTable } from "./_table";

export const post = mySqlTable("example", {
  id: serial("id").primaryKey(),
  title: varchar("name", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").onUpdateNow(),
});
