// src/server/router/index.ts
import { t } from "../trpc";

import { postRouter } from "./post";

export const appRouter = t.router({
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
