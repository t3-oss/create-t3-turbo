// We are importing `getPayload` because we don't need HMR
// for a standalone script. For usage of Payload inside Next.js,
// you should always use `import { getPayloadHMR } from '@payloadcms/next/utilities'` instead.
import { fileURLToPath } from "node:url";
import path from "path";
import dotenv from "dotenv";
import { getPayload } from "payload";
// This is a helper function that will make sure we can safely load the Payload Config
// and all of its client-side files, such as CSS, SCSS, etc.
import { importConfig } from "payload/node";

import buildConfig from "./payload.config";

// In ESM, you can create the "dirname" variable
// like this. We'll use this with `dotenv` to load our `.env` file, if necessary.
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// If you don't need to load your .env file,
// then you can skip this part!
dotenv.config({
  path: path.resolve(dirname, "../.env"),
});

const awaitedConfig = await importConfig("./payload.config.ts");

// Get a local copy of Payload by passing your config
const payload = await getPayload({ config: awaitedConfig });

export * from "./payload-types";
export { buildConfig, payload };
