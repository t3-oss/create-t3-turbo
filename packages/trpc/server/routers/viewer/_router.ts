import { publicViewerRouter } from "../publicViewer/_router";
import { createTRPCRouter, mergeRouters } from "./../../createContext";

export const viewerRouter = mergeRouters(
  publicViewerRouter,
  createTRPCRouter({
    // other routes
    public: publicViewerRouter,
  }),
);
