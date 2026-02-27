import { describe, expect, it } from "vitest";

import { rateLimitMiddleware } from "./rate-limit";

describe("rateLimitMiddleware", () => {
  const makeCtx = (userId = "user-1") => ({
    session: { user: { id: userId } },
  });

  const makeNext = () => vi.fn().mockResolvedValue({ ok: true });

  it("allows requests within the limit", async () => {
    const middleware = rateLimitMiddleware({
      maxRequests: 3,
      windowMs: 60_000,
    });
    const next = makeNext();

    await middleware({ ctx: makeCtx(), next, path: "test.allow" });
    await middleware({ ctx: makeCtx(), next, path: "test.allow" });
    await middleware({ ctx: makeCtx(), next, path: "test.allow" });

    expect(next).toHaveBeenCalledTimes(3);
  });

  it("blocks requests exceeding the limit", async () => {
    const middleware = rateLimitMiddleware({
      maxRequests: 2,
      windowMs: 60_000,
    });
    const next = makeNext();

    await middleware({ ctx: makeCtx(), next, path: "test.block" });
    await middleware({ ctx: makeCtx(), next, path: "test.block" });

    await expect(
      middleware({ ctx: makeCtx(), next, path: "test.block" }),
    ).rejects.toThrow("Rate limit exceeded");
  });

  it("tracks separate limits per user", async () => {
    const middleware = rateLimitMiddleware({
      maxRequests: 1,
      windowMs: 60_000,
    });
    const next = makeNext();

    await middleware({ ctx: makeCtx("a"), next, path: "test.peruser" });
    await middleware({ ctx: makeCtx("b"), next, path: "test.peruser" });

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("tracks separate limits per path", async () => {
    const middleware = rateLimitMiddleware({
      maxRequests: 1,
      windowMs: 60_000,
    });
    const next = makeNext();

    await middleware({ ctx: makeCtx(), next, path: "test.path1" });
    await middleware({ ctx: makeCtx(), next, path: "test.path2" });

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("uses anonymous key for unauthenticated users", async () => {
    const middleware = rateLimitMiddleware({
      maxRequests: 1,
      windowMs: 60_000,
    });
    const next = makeNext();

    await middleware({ ctx: { session: null }, next, path: "test.anon" });

    expect(next).toHaveBeenCalledTimes(1);
  });
});
