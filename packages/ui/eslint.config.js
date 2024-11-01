import baseConfig from "@battle-stadium/eslint-config/base";
import reactConfig from "@battle-stadium/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
