import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

import { transformer } from "@acme/api/transformer";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: transformer.output.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: transformer.output.deserialize,
      },
    },
  });
