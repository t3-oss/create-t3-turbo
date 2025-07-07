import nextPlugin from "@next/eslint-plugin-next";

import reactConfig from "./react.js";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  ...reactConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // TypeError: context.getAncestors is not a function
      "@next/next/no-duplicate-head": "off",
    },
  },
];
