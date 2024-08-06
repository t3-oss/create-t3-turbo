"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "./root";
import { env } from "./env";

export type { RouterInputs, RouterOutputs } from "@acme/api";
export const api = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  return (clientQueryClientSingleton ??= new QueryClient());
};

export function TRPCReactProvider(props: {
  children: React.ReactNode;
  source: string;
  token: string | null;
  baseUrl?: string;
}) {
  const { token, source, baseUrl = "" } = props;
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
          colorMode: "ansi",
        }),
        httpBatchLink({
          transformer: SuperJSON,
          url: `${baseUrl}/api/trpc`,
          headers() {
            const headers = new Headers();
            if (token) headers.set("Authorization", `Bearer ${token}`);
            headers.set("x-trpc-source", source);
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}
