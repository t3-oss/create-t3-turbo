import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { auth } from "@acme/auth";

import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

export const handler: ReturnType<typeof auth> = auth(async (req) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        session: req.auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });
  return response;
});
