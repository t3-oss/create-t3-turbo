import baseConfig, { restrictEnvAccess } from "@acme/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["script/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
