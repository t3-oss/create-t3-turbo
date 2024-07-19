import baseConfig from "@acme/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".nitro/**", ".output/**"],
  },
  ...baseConfig,
];
