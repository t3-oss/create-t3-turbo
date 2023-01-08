import { createTRPCRouter } from "./trpc";
import { postRouter } from "./router/post";
import { authRouter } from "./router/auth";

export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
