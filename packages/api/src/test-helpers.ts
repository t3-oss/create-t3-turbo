/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "@acme/db/client";

import type { createTRPCContext } from "./trpc";
import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

/**
 * Creates a caller that can be used to call tRPC procedures.
 *
 * @param opts - The context that is provided to tRPC
 * @returns A caller that can be used to call tRPC procedures
 */
export const makeTestCaller = (
  opts?: Partial<Awaited<ReturnType<typeof createTRPCContext>>>,
): ReturnType<typeof appRouter.createCaller> => {
  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    db,
    authApi: { getSession: () => null } as any,
    session: null,
    ...opts,
  });
};
