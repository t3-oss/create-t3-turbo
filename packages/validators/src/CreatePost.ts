import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
});
