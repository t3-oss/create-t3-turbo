import { accountRouter } from "./router/account";
import { adminRouter } from "./router/admin";
import { authRouter } from "./router/auth";
import { notificationRouter } from "./router/notification";
import { organizationRouter } from "./router/organization";
import { postRouter } from "./router/post";
import { settingsRouter } from "./router/settings";
import { subscriptionRouter } from "./router/subscription";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  admin: adminRouter,
  auth: authRouter,
  notification: notificationRouter,
  organization: organizationRouter,
  post: postRouter,
  settings: settingsRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
