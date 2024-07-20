import { getPayload } from "payload";
// This is a helper function that will make sure we can safely load the Payload Config
// and all of its client-side files, such as CSS, SCSS, etc.
import { importConfig } from "payload/node";

import buildConfig from "./payload.config";

const awaitedConfig = await importConfig("./payload.config.ts");

// Get a local copy of Payload by passing your config
const payload = await getPayload({ config: awaitedConfig });

// tthis is necessary so that consumers of this package can infer types of the Payload config
export * from "./payload-types";

export { buildConfig };

export default payload;
