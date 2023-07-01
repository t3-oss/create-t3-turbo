import type { AnyRouter } from "@trpc/server";
import { z } from "zod";

import * as trpcNext from "./adapters";
import { createTRPCContext } from "./createContext";

/**
 * Creates an API handler executed by Next.js.
 */
export function createNextApiHandler(router: AnyRouter, isPublic = false) {
  return trpcNext.createNextApiHandler({
    router,
    /**
     * @link https://trpc.io/docs/context
     */
    createContext: ({ req, res }) => {
      return createTRPCContext({ req, res });
    },
    /**
     * @link https://trpc.io/docs/error-handling
     */
    onError({ error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        // send to bug reporting
        console.error("Something went wrong", error);
      }
    },
    /**
     * Enable query batching
     */
    batching: {
      enabled: true,
    },
    /**
     * @link https://trpc.io/docs/caching#api-response-caching
     */
    responseMeta({ ctx, paths, type, errors }) {
      const allOk = errors.length === 0;
      const isQuery = type === "query";
      const noHeaders = {};

      // We cannot set headers on SSG queries
      if (!ctx?.res) return noHeaders;

      const defaultHeaders: Record<"headers", Record<string, string>> = {
        headers: {},
      };

      const timezone = z
        .string()
        .safeParse(ctx.req?.headers["x-vercel-ip-timezone"]);
      if (timezone.success)
        defaultHeaders.headers["x-flow-timezone"] = timezone.data;

      // We need all these conditions to be true to set cache headers
      if (!(isPublic && allOk && isQuery)) return defaultHeaders;

      // No cache by default
      defaultHeaders.headers["cache-control"] = `no-cache`;

      if (isPublic && paths) {
        const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
        const cacheRules = {
          session: `max-age=10, stale-while-revalidate=59`,
          i18n: `no-cache`,
          city: `max-age=${ONE_DAY_IN_SECONDS}, stale-while-revalidate`,
        } as const;

        const matchedPath = paths.find(
          (v) => v in cacheRules,
        ) as keyof typeof cacheRules;
        if (matchedPath)
          defaultHeaders.headers["cache-control"] = cacheRules[matchedPath];
      }

      return defaultHeaders;
    },
  });
}
