import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "./core";

/**
 * UploadThing API route handler.
 *
 * Exposes POST /api/uploadthing for file uploads.
 * See ./core.ts for the file router definition.
 */
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
