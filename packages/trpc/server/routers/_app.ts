import { createTRPCRouter } from "../createContext";
import { viewerRouter } from "./viewer/_router";

export const appRouter = createTRPCRouter({
  viewer: viewerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
