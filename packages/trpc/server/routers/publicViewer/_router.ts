import {
  createTRPCRouter,
  localeMiddleware,
  publicProcedure,
  sessionMiddleware,
} from "../../createContext";

type PublicViewerRouterHandlerCache = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  session?: typeof import("./session.handler").sessionHandler;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  i18n?: typeof import("./i18n.handler").i18nHandler;
};

const UNSTABLE_HANDLER_CACHE: PublicViewerRouterHandlerCache = {};

export const publicViewerRouter = createTRPCRouter({
  session: publicProcedure.use(sessionMiddleware).query(async ({ ctx }) => {
    if (!UNSTABLE_HANDLER_CACHE.session) {
      UNSTABLE_HANDLER_CACHE.session = await import("./session.handler").then(
        (mod) => mod.sessionHandler,
      );
    }

    // Unreachable code but required for type safety
    if (!UNSTABLE_HANDLER_CACHE.session) {
      throw new Error("Failed to load handler");
    }

    return UNSTABLE_HANDLER_CACHE.session({
      ctx,
    });
  }),
  i18n: publicProcedure.use(localeMiddleware).query(async ({ ctx }) => {
    if (!UNSTABLE_HANDLER_CACHE.i18n) {
      UNSTABLE_HANDLER_CACHE.i18n = await import("./i18n.handler").then(
        (mod) => mod.i18nHandler,
      );
    }

    // Unreachable code but required for type safety
    if (!UNSTABLE_HANDLER_CACHE.i18n) {
      throw new Error("Failed to load handler");
    }

    return UNSTABLE_HANDLER_CACHE.i18n({ ctx });
  }),
});
