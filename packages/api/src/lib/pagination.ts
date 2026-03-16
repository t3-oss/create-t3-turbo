import type { SQL } from "@gmacko/db";
import { and, asc, desc, gt, lt } from "@gmacko/db";
import { z } from "zod/v4";

/**
 * Cursor-based pagination input schema.
 * Use with `.input(paginationInput)` in tRPC procedures.
 */
export const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export type PaginationInput = z.infer<typeof paginationInput>;

/**
 * Build a paginated response with cursor metadata.
 */
export function paginatedResponse<T extends { id: string }>(
  items: T[],
  input: PaginationInput,
) {
  const hasMore = items.length > input.limit;
  const data = hasMore ? items.slice(0, input.limit) : items;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
    hasMore,
  };
}

/**
 * Build WHERE + ORDER clauses for cursor pagination on a given column.
 *
 * Usage:
 * ```ts
 * const { where, orderBy } = cursorQuery(table.id, input);
 * const items = await db
 *   .select()
 *   .from(table)
 *   .where(and(yourFilters, where))
 *   .orderBy(orderBy)
 *   .limit(input.limit + 1);
 * return paginatedResponse(items, input);
 * ```
 */
export function cursorQuery<TCol extends { _: { data: string } }>(
  column: TCol,
  input: PaginationInput,
): { where: SQL | undefined; orderBy: SQL } {
  const isForward = input.direction === "forward";

  const where = input.cursor
    ? isForward
      ? gt(column as never, input.cursor)
      : lt(column as never, input.cursor)
    : undefined;

  const orderBy = isForward
    ? asc(column as never)
    : desc(column as never);

  return { where, orderBy };
}
