import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["vitest.setup.ts"],
    coverage: {
      exclude: [
        ".next/**/*",
        "node_modules/**/*",
        // config files
        "*.config.ts",
        "*.config.js",
        "*.config.cjs",
        "src/env.ts",
        "src/trpc/**/*",
        // prebuilt route handlers
        "src/app/api/auth/**/*",
        "src/app/api/trpc/**/*",
      ],
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
