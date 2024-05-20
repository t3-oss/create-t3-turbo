import { createServer } from "http";

/** @param {unknown} port */
export function sanititisePort(port) {
  // @ts-expect-error: we are not using the port as a number
  const portNumber = Number.parseInt(port, 10);
  return Number.isNaN(portNumber) ? null : portNumber;
}

/**
 * @param {number} initialPort
 */
export async function getUnusedPort(initialPort) {
  let port = initialPort;
  while (await isPortInUse(port)) {
    port += 1;
  }
  return port;
}

/**
 * @param {number} port
 */
export function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.on("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.on("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}
