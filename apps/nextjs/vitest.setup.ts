/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { vi } from "vitest";

vi.mock("~/env", () => ({
  env: {
    VERCEL_ENV: "",
  },
}));

vi.mock("next/font/local", () => ({
  default: () => ({
    style: {
      fontFamily: "mocked",
    },
  }),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
