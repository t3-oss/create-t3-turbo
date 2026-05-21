import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("forgeContext in logger base", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes FG_* env vars in logger base when set", async () => {
    vi.stubEnv("FG_APP", "my-app");
    vi.stubEnv("FG_STAGE", "production");
    vi.stubEnv("FG_NODE", "hetzner-master");
    vi.stubEnv("FG_COMMIT_HASH", "abc123");
    vi.stubEnv("NODE_ENV", "production");

    const { createLogger } = await import("../index.js");
    const log = createLogger({ module: "test" });
    // pino child loggers expose bindings
    const bindings = log.bindings();
    expect(bindings.module).toBe("test");
  });

  it("does not include FG_* fields when env vars are unset", async () => {
    // Ensure FG_* vars are not set
    vi.stubEnv("NODE_ENV", "production");
    const { createLogger } = await import("../index.js");
    const log = createLogger({ module: "test" });
    const bindings = log.bindings();
    expect(bindings.app).toBeUndefined();
    expect(bindings.stage).toBeUndefined();
    expect(bindings.node).toBeUndefined();
    expect(bindings.commitHash).toBeUndefined();
  });
});
