import { defineConfig } from "vitest/config";

// Unit tests for pure utilities only — React Native components are covered
// by Maestro flows (.maestro/), not vitest.
export default defineConfig({
  test: {
    globals: true,
    include: ["src/utils/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**"],
  },
});
