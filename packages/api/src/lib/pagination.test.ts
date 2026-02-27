import { describe, expect, it } from "vitest";

import { paginatedResponse, paginationInput } from "./pagination";

describe("paginationInput", () => {
  it("accepts valid input", () => {
    const result = paginationInput.safeParse({ limit: 10 });
    expect(result.success).toBe(true);
  });

  it("defaults limit to 20", () => {
    const result = paginationInput.parse({});
    expect(result.limit).toBe(20);
  });

  it("defaults direction to forward", () => {
    const result = paginationInput.parse({});
    expect(result.direction).toBe("forward");
  });

  it("rejects limit above 100", () => {
    const result = paginationInput.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = paginationInput.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });
});

describe("paginatedResponse", () => {
  const makeItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
    }));

  it("returns hasMore: false when items fit within limit", () => {
    const items = makeItems(5);
    const result = paginatedResponse(items, {
      limit: 20,
      direction: "forward",
    });

    expect(result.data).toHaveLength(5);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it("returns hasMore: true when more items exist", () => {
    // Fetch limit + 1 to detect more pages
    const items = makeItems(21);
    const result = paginatedResponse(items, {
      limit: 20,
      direction: "forward",
    });

    expect(result.data).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("item-19");
  });

  it("handles empty results", () => {
    const result = paginatedResponse([], {
      limit: 20,
      direction: "forward",
    });

    expect(result.data).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });
});
