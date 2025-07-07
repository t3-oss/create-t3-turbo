import reactConfig from "@acme/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["expo-plugins/**"],
  },
  ...reactConfig,
];
