/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidateTag, unstable_cache } from "next/cache";
import {
  callProcedure,
  type AnyMutationProcedure,
  type AnyProcedure,
  type AnyQueryProcedure,
  type AnyRouter,
  type AnySubscriptionProcedure,
  type MaybePromise,
  type ProcedureRouterRecord,
  type ProcedureType,
  type inferProcedureInput,
  type inferProcedureOutput,
  type inferRouterContext,
} from "@trpc/server";
import { createRecursiveProxy } from "@trpc/server/shared";

type QueryResolver<TProcedure extends AnyProcedure> = (
  input: inferProcedureInput<TProcedure>,
  opts?: {
    revalidate?: number | false;
  },
) => Promise<inferProcedureOutput<TProcedure>>;

type Resolver<TProcedure extends AnyProcedure> = (
  input: inferProcedureInput<TProcedure>,
) => Promise<inferProcedureOutput<TProcedure>>;

type DecorateProcedure<TProcedure extends AnyProcedure> =
  TProcedure extends AnyQueryProcedure
    ? {
        query: QueryResolver<TProcedure>;
        revalidate(): void;
      }
    : TProcedure extends AnyMutationProcedure
    ? {
        mutate: Resolver<TProcedure>;
      }
    : TProcedure extends AnySubscriptionProcedure
    ? {
        subscribe: Resolver<TProcedure>;
      }
    : never;

type DecoratedProcedureRecord<TProcedures extends ProcedureRouterRecord> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<TProcedures[TKey]["_def"]["record"]>
    : TProcedures[TKey] extends AnyProcedure
    ? DecorateProcedure<TProcedures[TKey]>
    : never;
};

export function createTRPCNextCaller<TRouter extends AnyRouter>(config: {
  router: TRouter;
  createContext: () => MaybePromise<inferRouterContext<TRouter>>;
}): DecoratedProcedureRecord<TRouter["_def"]["record"]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return createRecursiveProxy(async (opts) => {
    const [input, callOpts] = opts.args as Parameters<
      QueryResolver<AnyQueryProcedure>
    >;

    const action = opts.path.pop();
    const procedurePath = opts.path.join(".");
    const cacheTag = input
      ? `${procedurePath}?input=${JSON.stringify(input)}`
      : procedurePath;

    const type: ProcedureType =
      action === "mutate"
        ? "mutation"
        : action === "subscribe"
        ? "subscription"
        : "query";

    if (action === "revalidate") {
      return revalidateTag(cacheTag);
    }

    const ctx = await config.createContext();

    const callProc = async () =>
      callProcedure({
        procedures: config.router._def.procedures,
        path: procedurePath,
        ctx,
        rawInput: input,
        type,
      });

    if (type === "query") {
      return unstable_cache(
        callProc,
        opts.path, // <- what does this do?
        {
          revalidate: callOpts?.revalidate ?? false,
          tags: [cacheTag],
        },
      )();
    }

    return callProc();
  }) as any;
}
