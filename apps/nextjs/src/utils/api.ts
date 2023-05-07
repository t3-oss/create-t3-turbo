import { createTRPCNextCaller } from "@trpc/app-router";
import { getServerSession } from "next-auth/next";

import { appRouter, type AppRouter } from "@acme/api";
import { createInnerTRPCContext } from "@acme/api/src/trpc";
import { authOptions } from "@acme/auth";

export const api = createTRPCNextCaller<AppRouter>({
  router: appRouter,
  createContext: async () => {
    const session = await getServerSession(authOptions);
    return createInnerTRPCContext({ session });
  },
});

export { type RouterInputs, type RouterOutputs } from "@acme/api";
