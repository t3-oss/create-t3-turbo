import { describe, expect, test } from "vitest";

import { makeTestCaller, makeTestCallerWithSession } from "../tests/testCaller";

describe("auth router", () => {
  test("getSession returns null when no session exists", async () => {
    const caller = makeTestCaller();

    const session = await caller.auth.getSession();
    expect(session).toBeNull();
  });

  test("getSession returns session when it exists", async () => {
    const caller = makeTestCallerWithSession();

    const session = await caller.auth.getSession();
    expect(session?.user).toEqual({ id: "123", email: "test@test.com" });
  });

  test("getSecretMessage throws error when not authenticated", async () => {
    const caller = makeTestCaller();

    await expect(caller.auth.getSecretMessage()).rejects.toThrow();
  });
});
