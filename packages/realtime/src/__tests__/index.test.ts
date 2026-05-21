import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function mockLogging() {
  vi.doMock("@gmacko/logging", () => ({
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  }));
}

describe("realtime (disabled)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("@gmacko/config", () => ({
      integrations: {
        realtime: { enabled: false, provider: "none" },
      },
    }));
    mockLogging();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initRedis returns null when integration disabled", async () => {
    const { initRedis } = await import("../index.js");
    const result = await initRedis();
    expect(result).toBeNull();
  });

  it("getRedis returns null when integration disabled", async () => {
    const { getRedis } = await import("../index.js");
    const result = getRedis();
    expect(result).toBeNull();
  });

  it("publish returns false when integration disabled", async () => {
    const { publish } = await import("../index.js");
    const result = await publish("test-channel", "test-event", { foo: "bar" });
    expect(result).toBe(false);
  });

  it("subscribe returns a no-op cleanup function when integration disabled", async () => {
    const { subscribe } = await import("../index.js");
    const handler = vi.fn();
    const cleanup = await subscribe("test-channel", handler);
    expect(cleanup).toBeTypeOf("function");
    await cleanup();
  });

  it("createQueue returns null when integration disabled", async () => {
    const { createQueue } = await import("../index.js");
    const result = await createQueue("test-queue");
    expect(result).toBeNull();
  });

  it("createWorker returns null when integration disabled", async () => {
    const { createWorker } = await import("../index.js");
    const result = await createWorker("test-worker", async () => {});
    expect(result).toBeNull();
  });

  it("shutdown does not throw when no clients initialized", async () => {
    const { shutdown } = await import("../index.js");
    await expect(shutdown()).resolves.not.toThrow();
  });
});

describe("realtime (enabled) - subscribe message validation", () => {
  let enabledMockOn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    enabledMockOn = vi.fn();

    vi.doMock("@gmacko/config", () => ({
      integrations: {
        realtime: { enabled: true, provider: "redis" },
      },
    }));
    mockLogging();

    vi.doMock("ioredis", () => {
      class MockRedis {
        publish = vi.fn().mockResolvedValue(1);
        subscribe = vi.fn().mockResolvedValue(undefined);
        on = enabledMockOn;
        off = vi.fn();
        unsubscribe = vi.fn().mockResolvedValue(undefined);
        quit = vi.fn().mockResolvedValue(undefined);
      }
      return { default: MockRedis };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getMessageListener(): (ch: string, message: string) => void {
    const onCalls = enabledMockOn.mock.calls as [string, Function][];
    const entry = onCalls.find(([event]) => event === "message");
    expect(entry).toBeDefined();
    return entry![1] as (ch: string, message: string) => void;
  }

  it("handler is NOT called for messages with invalid shape", async () => {
    const { subscribe } = await import("../index.js");
    const handler = vi.fn();

    await subscribe("chan", handler);
    const listener = getMessageListener();

    listener("chan", JSON.stringify({ data: { foo: "bar" } }));
    expect(handler).not.toHaveBeenCalled();

    listener("chan", JSON.stringify({ event: "test", data: "string" }));
    expect(handler).not.toHaveBeenCalled();

    listener("chan", JSON.stringify({ event: "test", data: null }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("handler SHOULD be called for valid messages", async () => {
    const { subscribe } = await import("../index.js");
    const handler = vi.fn();

    await subscribe("chan", handler);
    const listener = getMessageListener();

    listener(
      "chan",
      JSON.stringify({ event: "user:created", data: { id: "123" } }),
    );
    expect(handler).toHaveBeenCalledWith("user:created", { id: "123" });
  });

  it("handler should NOT receive messages from other channels", async () => {
    const { subscribe } = await import("../index.js");
    const handler = vi.fn();

    await subscribe("my-channel", handler);
    const listener = getMessageListener();

    listener(
      "other-channel",
      JSON.stringify({ event: "test", data: { ok: true } }),
    );
    expect(handler).not.toHaveBeenCalled();

    listener(
      "my-channel",
      JSON.stringify({ event: "test", data: { ok: true } }),
    );
    expect(handler).toHaveBeenCalledWith("test", { ok: true });
  });
});
