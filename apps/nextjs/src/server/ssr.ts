import type { GetServerSidePropsContext } from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import superjson from "superjson";

import { getLocaleFromHeaders } from "@acme/lib/i18n";
import { createTRPCContext } from "@acme/trpc/server/createContext";
import { appRouter } from "@acme/trpc/server/routers/_app";

import i18nNextConfig from "../../next-i18next.config.mjs";

/**
 * Initialize server-side rendering tRPC helpers.
 * Provides a method to prefetch tRPC-queries in a `getServerSideProps`-function.
 * Automatically prefetches i18n based on the passed in `context`-object to prevent i18n-flickering.
 * Make sure to `return { props: { trpcState: ssr.dehydrate() } }` at the end.
 */
export async function ssrInit(context: GetServerSidePropsContext) {
  const ctx = await createTRPCContext(context);
  const locale = getLocaleFromHeaders(context.req);
  const i18n = await serverSideTranslations(
    getLocaleFromHeaders(context.req) || "en",
    ["common"],
    i18nNextConfig,
  );

  const ssr = createServerSideHelpers({
    router: appRouter,
    transformer: superjson,
    ctx: { ...ctx, locale, i18n },
  });

  // always preload "viewer.public.i18n"
  await ssr.viewer.public.i18n.prefetch();

  return ssr;
}
