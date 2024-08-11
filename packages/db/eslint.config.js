import baseConfig, { restrictEnvAccess } from "@acme/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [...baseConfig, ...restrictEnvAccess];
