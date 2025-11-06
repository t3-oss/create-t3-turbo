import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const Post = pgTable("post", (t) => ({
  id: t.uuid("id").notNull().primaryKey().defaultRandom(),
  title: t.varchar("title", { length: 256 }).notNull(),
  content: t.text("content").notNull(),
  createdAt: t.timestamp("createdAt").defaultNow().notNull(),
  updatedAt: t
    .timestamp("updatedAt", { mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
