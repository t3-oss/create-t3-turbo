import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "./root";
import { createTRPCContext } from "./trpc";

export const handler = async (req: Request) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext(req),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });
  return response;
};
