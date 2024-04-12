import { createInsertSchema } from "drizzle-zod";

import { schema } from "@acme/db/schema";

export const CreatePostSchema = createInsertSchema(schema.post);
