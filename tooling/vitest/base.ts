import type { ViteUserConfig } from "vitest/config";

export default {
  test: {
    globals: true,
    environment: "node",
  },
} satisfies ViteUserConfig;
