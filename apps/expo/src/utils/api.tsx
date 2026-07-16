import type { AppRouter } from "@gmacko/api";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";
import { getToken } from "./session-store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ...
    },
  },
});

/**
 * A set of typesafe hooks for consuming your API.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
        colorMode: "ansi",
      }),
      httpBatchLink({
        transformer: superjson,
        url: `${getBaseUrl()}/api/trpc`,
        headers() {
          const headers = new Map<string, string>();
          headers.set("x-trpc-source", "expo-react");

          const cookies = authClient.getCookie();
          if (cookies) {
            headers.set("Cookie", cookies);
          }

          // Device-paired sessions authenticate with a bearer session token
          // instead of a cookie (handled by the server's `bearer` plugin).
          const pairedToken = getToken();
          if (pairedToken) {
            headers.set("Authorization", `Bearer ${pairedToken}`);
          }
          return headers;
        },
      }),
    ],
  }),
  queryClient,
});

export type { RouterInputs, RouterOutputs } from "@gmacko/api";
