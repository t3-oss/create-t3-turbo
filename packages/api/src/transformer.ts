import type { TRPCCombinedDataTransformer } from "@trpc/server";
import SuperJSON from "superjson";

/**
 * tRPC transformer, used to serialize/deserialize data between client and server.
 * This export is used internally in `@acme/api` and in both `apps/nextjs` and `apps/expo`.
 *
 * ! IMPORTANT: changing this is a BREAKING CHANGE !
 * ? Even though this helps swapping transformers, bear in mind that distributed Expo apps
 * ? will have the previous transformer bundled in their device, which will cause a mismatch
 * ? in how the data is sent and received (basically, all API requests will fail).
 */
export const transformer: TRPCCombinedDataTransformer = {
  input: {
    serialize: SuperJSON.serialize,
    deserialize: SuperJSON.deserialize,
  },
  output: {
    serialize: SuperJSON.serialize,
    deserialize: SuperJSON.deserialize,
  },
};
