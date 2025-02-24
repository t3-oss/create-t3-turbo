import type { createTRPCContext } from "../trpc";
import { appRouter } from "../root";
import { createCallerFactory } from "../trpc";

/**
 * Creates a caller that can be used to call tRPC procedures.
 *
 * @param opts - The context that is provided to tRPC
 * @returns A caller that can be used to call tRPC procedures
 */
export const makeTestCaller = (
  opts?: Omit<
    Awaited<ReturnType<typeof createTRPCContext>>,
    "session" | "token"
  >,
) => {
  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    ...opts,
    session: null,
    token: null,
  });
};

export const makeTestCallerWithSession = (
  opts?: Omit<
    Awaited<ReturnType<typeof createTRPCContext>>,
    "session" | "token"
  >,
) => {
  const createCaller = createCallerFactory(appRouter);

  return createCaller({
    ...opts,
    session: {
      user: { id: "123", email: "test@test.com" },
      expires: new Date().toISOString(),
    },
    token: "test-token",
  });
};
