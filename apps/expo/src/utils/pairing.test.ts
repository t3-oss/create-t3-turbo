import { describe, expect, it } from "vitest";

import { parsePairingQR } from "./pairing";

describe("parsePairingQR", () => {
  it("accepts a valid pairing payload", () => {
    expect(
      parsePairingQR(
        JSON.stringify({ url: "https://app.example", code: "abc" }),
      ),
    ).toEqual({ url: "https://app.example", code: "abc" });
  });

  it("rejects non-JSON input", () => {
    expect(parsePairingQR("not json")).toBeNull();
    expect(parsePairingQR("")).toBeNull();
  });

  it("rejects payloads with missing or wrongly-typed fields", () => {
    expect(parsePairingQR(JSON.stringify({ url: "https://x" }))).toBeNull();
    expect(parsePairingQR(JSON.stringify({ code: "abc" }))).toBeNull();
    expect(parsePairingQR(JSON.stringify({ url: 1, code: "abc" }))).toBeNull();
    expect(
      parsePairingQR(JSON.stringify({ url: "https://x", code: {} })),
    ).toBeNull();
    expect(parsePairingQR(JSON.stringify(["https://x", "abc"]))).toBeNull();
    expect(parsePairingQR("null")).toBeNull();
  });

  it("ignores extra fields", () => {
    expect(
      parsePairingQR(
        JSON.stringify({ url: "https://x", code: "abc", extra: true }),
      ),
    ).toEqual({ url: "https://x", code: "abc" });
  });
});
