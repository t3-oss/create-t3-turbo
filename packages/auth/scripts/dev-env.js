// @ts-check
import { networkInterfaces } from "os";
import path from "path";

import { makeGetDevEnv } from "@acme/scripts/dev-env.js";
import { getUnusedPort, sanititisePort } from "@acme/scripts/http.js";

export const EnvVars = Object.freeze({
  HOSTNAME: "HOSTNAME",
  PORT: "PORT",
  AUTH_URL: "AUTH_URL",
});

export const getDevEnv = makeGetDevEnv(
  [
    [EnvVars.HOSTNAME, hostnameFallbackFn],
    [EnvVars.PORT, portFallbackFn],
    [EnvVars.AUTH_URL, authUrlFallbackFn],
  ],
  {
    source: `/packages/auth/scripts/dev-env.js`,
    readme: path.relative(
      process.cwd(),
      path.resolve(import.meta.dirname, "../README.md"),
    ),
  },
);

export const NEXTJS_INITIAL_PORT =
  // eslint-disable-next-line no-restricted-properties
  sanititisePort(process.env.PORT) ??
  // TODO: read port from command?
  null ??
  3000;

// this is not going to work in Expo, but using it anyway as default
const NEXTJS_INITIAL_HOSTNAME = "localhost";

const NEXTJS_INITIAL_PROTOCOL = "http";

/** @type {import('@acme/scripts/dev-env.js').FallbackFn} */
export function hostnameFallbackFn() {
  const interfaces = networkInterfaces();
  /** @type {string[]} */
  const addresses = [];
  for (const name in interfaces) {
    const candidates = interfaces[name] ?? [];
    for (const candidate of candidates) {
      if (candidate.family === "IPv4" && !candidate.internal) {
        addresses.push(candidate.address);
      }
    }
  }
  const [address = NEXTJS_INITIAL_HOSTNAME] = addresses.sort(
    (a, b) => getIPv4Priority(a) - getIPv4Priority(b),
  );
  return address;
}

/** @type {import('@acme/scripts/dev-env.js').FallbackFn} */
export async function portFallbackFn() {
  return getUnusedPort(NEXTJS_INITIAL_PORT).then(String);
}

/** @type {import('@acme/scripts/dev-env.js').FallbackFn} */
export function authUrlFallbackFn() {
  const protocol = NEXTJS_INITIAL_PROTOCOL;

  return `${protocol}://$${EnvVars.HOSTNAME}:$${EnvVars.PORT}`;
}

/** @param {string} ipv4 */
export function getIPv4Priority(ipv4) {
  switch (true) {
    case ipv4.startsWith("127."):
      return 1000;
    case ipv4.startsWith("192.168.1."):
      return -100;
    case ipv4.startsWith("192.168."):
      return -1;
    default:
      return 0;
  }
}
