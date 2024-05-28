// @ts-check
import * as api from "@acme/api/scripts/dev-env.js";
import * as auth from "@acme/auth/scripts/dev-env.js";
import { addDevEnvToFile, makeDevEnv } from "@acme/scripts/dev-env.js";

const filePath = "../../.env.local";
const devEnv = await makeDevEnv([api.getDevEnv, auth.getDevEnv]);

await addDevEnvToFile({
  filePath,
  devEnv,
  source: "/apps/nextjs/scripts/write-dev-env.js",
}).catch((err) => {
  console.error(`Failed to write dev env variables to ${filePath}`, err);
  process.exit(1);
});
