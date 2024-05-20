// @ts-check
import { networkInterfaces } from "os";
import path from "path";

import { makeGetDevEnv } from "@acme/scripts/dev-env.js";
import { getUnusedPort, sanititisePort } from "@acme/scripts/http.js";

export const getDevEnv = makeGetDevEnv([["AUTH_URL", getAuthUrlFallback]], {
  source: `/packages/auth/scripts/dev-env.js`,
  readme: path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, "../README.md"),
  ),
});

const NEXTJS_INITIAL_PORT =
  // eslint-disable-next-line no-restricted-properties
  sanititisePort(process.env.PORT) ??
  // TODO: read port from command?
  null ??
  3000;

async function getAuthUrlFallback() {
  const protocol = "http";
  const port = await getUnusedPort(NEXTJS_INITIAL_PORT);
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
  const [address] = addresses.sort(
    (a, b) => getIPv4Priority(a) - getIPv4Priority(b),
  );
  return address
    ? `${protocol}://${address}:${port}`
    : // this will not work in expo app, but trying anyway...
      `${protocol}://localhost:${port}`;
}

/** @param {string} ipv4 */
function getIPv4Priority(ipv4) {
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
