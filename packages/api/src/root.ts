import { tsr } from "@ts-rest/serverless/next";

import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { userContract, userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const apiRouter = tsr.router(userContract, {
  ...userRouter,
});
