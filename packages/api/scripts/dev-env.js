// @ts-check
import path from "path";

import {
  EnvVars as AuthEnvVars,
  baseUrlFallbackFn,
  hostnameFallbackFn,
  portFallbackFn,
} from "@acme/auth/scripts/dev-env.js";
import { makeGetDevEnv } from "@acme/scripts/dev-env.js";

export const EnvVars = Object.freeze({
  HOSTNAME: AuthEnvVars.HOSTNAME,
  PORT: AuthEnvVars.PORT,
  EXPO_PUBLIC_API_BASE_URL: "EXPO_PUBLIC_API_BASE_URL",
});

/** @typedef {keyof typeof EnvVars} EnvVarsKeys */
/** @typedef {import('@acme/scripts/dev-env.js').FallbackFn<EnvVarsKeys>} AuthFallbackFn */

export const getDevEnv = makeGetDevEnv(
  [
    [EnvVars.HOSTNAME, hostnameFallbackFn],
    [EnvVars.PORT, portFallbackFn],
    [EnvVars.EXPO_PUBLIC_API_BASE_URL, baseUrlFallbackFn],
  ],
  {
    source: `/packages/api/scripts/dev-env.js`,
    readme: path.relative(
      process.cwd(),
      path.resolve(import.meta.dirname, "../README.md"),
    ),
  },
);
