"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

import { api } from "~/utils/api";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:3000`; // dev SSR should use localhost
};

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          {props.children}
        </api.Provider>
      </ReactQueryStreamedHydration>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
