import { cache } from "react";
import { headers } from "next/headers";
import { QueryClient } from "@tanstack/react-query";

import type { AppRouter } from "@acme/api";
import { createCaller, createTRPCContext } from "@acme/api";
import { auth } from "@acme/auth";

import { createHydrationHelpers } from "./hydration-helpers";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: await auth(),
    headers: heads,
  });
});

export const api = createCaller(createContext);

const getQueryClient = cache(() => new QueryClient());
export const { HydrateClient, setQueryData } =
  createHydrationHelpers<AppRouter>(getQueryClient);
