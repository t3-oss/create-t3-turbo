import { restrictEnvAccess } from "@acme/eslint-config/base";
import nextjsConfig from "@acme/eslint-config/nextjs";

/** @type {import('typescript-eslint').Config} */
export default [...nextjsConfig, ...restrictEnvAccess];
