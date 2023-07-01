import { trpc } from "../";

export function useMeQuery(options?: {
  enabled?: boolean;
  keepPreviousData?: boolean;
  staleTime?: number;
}) {
  const meQuery = trpc.viewer.me.useQuery(undefined, {
    retry(failureCount: number) {
      return failureCount > 3;
    },
    // set a longer stale time for dev environment since I refresh a lot
    // a rapid firing sql query during dev would mean an error in code.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    staleTime:
      process.env.NODE_ENV === "development" ? 60000 : options?.staleTime ?? 0,
    ...options,
  });

  return meQuery;
}

export default useMeQuery;
