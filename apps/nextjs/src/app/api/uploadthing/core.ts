import type { FileRouter } from "uploadthing/next";

import { createFileRouter, isStorageEnabled } from "@gmacko/storage";

import { getSession } from "~/auth/server";

/**
 * UploadThing file router — defines upload endpoints.
 *
 * Pattern:
 * 1. Define each upload route with size/type limits
 * 2. Add auth middleware to protect uploads
 * 3. Add onUploadComplete to process the file
 *
 * Enable by setting UPLOADTHING_TOKEN in .env and
 * enabling storage in @gmacko/config/integrations.
 */

const f = createFileRouter();

/**
 * Build the actual router when storage is enabled.
 * When disabled, exports an empty router so the app still compiles.
 */
export const uploadRouter = (
  f && isStorageEnabled()
    ? {
        /** Avatar upload — max 2MB, images only */
        avatar: f({
          image: { maxFileSize: "2MB", maxFileCount: 1 },
        })
          .middleware(async () => {
            const session = await getSession();
            if (!session?.user) throw new Error("Unauthorized");
            return { userId: session.user.id };
          })
          .onUploadComplete(async ({ metadata, file }) => {
            // TODO: Update user.image in database
            console.log(`Avatar uploaded for user ${metadata.userId}: ${file.url}`);
            return { url: file.url };
          }),

        /** General file upload — max 4MB, common document types */
        attachment: f({
          image: { maxFileSize: "4MB", maxFileCount: 4 },
          pdf: { maxFileSize: "4MB", maxFileCount: 2 },
        })
          .middleware(async () => {
            const session = await getSession();
            if (!session?.user) throw new Error("Unauthorized");
            return { userId: session.user.id };
          })
          .onUploadComplete(async ({ metadata, file }) => {
            console.log(`File uploaded by ${metadata.userId}: ${file.url}`);
            return { url: file.url };
          }),
      }
    : {}
) satisfies FileRouter;

export type AppFileRouter = typeof uploadRouter;
