import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth/next";

import { appRouter } from "@acme/api";
import { createInnerTRPCContext } from "@acme/api/src/trpc";
import { authOptions } from "@acme/auth";

// NOT USED YET - ALL TRPC CALLS ARE DIRECTLY INVOKED IN RSC LAND
const handler = (req: Request) =>
  fetchRequestHandler({
    router: appRouter,
    req,
    endpoint: "/api/trpc",
    createContext: async () => {
      const session = await getServerSession(authOptions);
      return createInnerTRPCContext({ session });
    },
  });
export { handler as GET, handler as POST };
