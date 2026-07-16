import { defineConfig } from "vitest/config";

// Pure-unit tests only (no database). The end-to-end device-pairing and SSO
// flows require a live Postgres the emulate PGlite stack can't schema-push
// into, so they live in the manually-run `pnpm verify:flows` script instead.
export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
