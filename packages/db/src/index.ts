import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import * as schema from "./schema";

export * from "drizzle-orm/sql";
export { alias } from "drizzle-orm/mysql-core";

export const createPostSchema = createInsertSchema(schema.post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
