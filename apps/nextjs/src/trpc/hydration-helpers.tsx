import type { QueryClient } from "@tanstack/react-query";
import type {
  AnyTRPCProcedure,
  AnyTRPCQueryProcedure,
  AnyTRPCRouter,
  TRPCRouterRecord,
} from "@trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createFlatProxy,
  createRecursiveProxy,
} from "@trpc/server/unstable-core-do-not-import";
import { getQueryKeyInternal } from "node_modules/@trpc/react-query/dist/internals/getQueryKey";

/**
 * Some internal shit used to hydrate query client on the client
 * tRPC should probably have something like this built-in. The current
 * `getQueryKey` requires React createContext to be defined...
 *
 * This also provides some DX helpers to more easily perform hydration
 * for queries fetched in RSC.
 */

type DecorateProcedure<TProcedure extends AnyTRPCProcedure> = (
  input: TProcedure["_def"]["_input_in"],
) => TProcedure["_def"]["_output_out"];

type DecorateRouterRecord<TRecord extends TRPCRouterRecord> = {
  [TKey in keyof TRecord]: TRecord[TKey] extends AnyTRPCQueryProcedure
    ? DecorateProcedure<TRecord[TKey]>
    : TRecord[TKey] extends TRPCRouterRecord
      ? DecorateRouterRecord<TRecord[TKey]>
      : never;
};

export function createHydrationHelpers<TRouter extends AnyTRPCRouter>(
  getQueryClient: () => QueryClient,
) {
  type Proxy = DecorateRouterRecord<TRouter["_def"]["record"]>;

  const proxy = createFlatProxy<Proxy>((key) =>
    createRecursiveProxy(({ path }) => {
      const fullPath = [key, ...path];
      console.log("path", fullPath);
      return fullPath;
    }),
  );

  function setQueryData<T extends AnyTRPCQueryProcedure>(
    cb: (p: Proxy) => [DecorateProcedure<T>, T["_def"]["_input_in"]],
    data: T["_def"]["_output_out"],
  ) {
    const [proc, input] = cb(proxy);
    const path = proc(input);
    const key = getQueryKeyInternal(path, input, "query");
    getQueryClient().setQueryData(key, data);
  }

  function HydrateClient(props: { children: React.ReactNode }) {
    const state = dehydrate(getQueryClient());
    console.log("state", state);

    return (
      <HydrationBoundary state={state}>{props.children}</HydrationBoundary>
    );
  }

  return { setQueryData, HydrateClient };
}
