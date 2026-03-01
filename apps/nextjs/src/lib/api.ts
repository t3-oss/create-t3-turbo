import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { appRouter, createTRPCContext } from "@gmacko/api";

import { auth } from "~/auth/server";

/**
 * Server-side tRPC caller for direct data access in Server Components.
 *
 * Usage in a Server Component:
 *   import { api } from "~/lib/api";
 *
 *   export default async function MyPage() {
 *     const posts = await api.post.all();
 *     const user = await api.account.exportData();
 *   }
 *
 * This is different from the `prefetch` pattern in ~/trpc/server which
 * prefetches data for client-side hydration. Use `api` when you need
 * data directly in a Server Component without hydration.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc-caller");

  return createTRPCContext({
    headers: heads,
    auth,
  });
});

const createCaller = cache(() =>
  appRouter.createCaller(createContext),
);

export const api = new Proxy({} as ReturnType<typeof appRouter.createCaller>, {
  get: (_target, prop) => {
    const caller = createCaller();
    return caller[prop as keyof typeof caller];
  },
});
