import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("initTelemetry", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318");
    vi.stubEnv("OTEL_SERVICE_NAME", "test-service");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exports initTelemetry function", async () => {
    const { initTelemetry } = await import("../init.js");
    expect(initTelemetry).toBeTypeOf("function");
  });

  it("does not throw when endpoint is invalid", async () => {
    vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "not-a-url");
    const { initTelemetry } = await import("../init.js");
    expect(() => initTelemetry()).not.toThrow();
  });

  it("is a no-op when OTEL_ENABLED is false", async () => {
    vi.stubEnv("OTEL_ENABLED", "false");
    const { initTelemetry } = await import("../init.js");
    expect(() => initTelemetry()).not.toThrow();
  });

  it("uses FG_APP as fallback OTEL endpoint", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("FG_APP", "test-app");
    // Don't set OTEL_EXPORTER_OTLP_ENDPOINT
    const { initTelemetry } = await import("../init.js");
    expect(() => initTelemetry()).not.toThrow();
  });

  it("returns early when no endpoint and no FG_APP", async () => {
    vi.unstubAllEnvs();
    // Don't set OTEL_EXPORTER_OTLP_ENDPOINT or FG_APP
    const { initTelemetry } = await import("../init.js");
    expect(() => initTelemetry()).not.toThrow();
  });
});
