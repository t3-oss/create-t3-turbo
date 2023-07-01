import { createNextApiHandler } from "@acme/trpc/server/createNextApiHandler";
import { publicViewerRouter } from "@acme/trpc/server/routers/publicViewer/_router";

export default createNextApiHandler(publicViewerRouter);
