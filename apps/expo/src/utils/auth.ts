import { expoClient } from "@better-auth/expo/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getBaseUrl } from "./base-url";
import { getToken } from "./session-store";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "expo",
      storagePrefix: "expo",
      storage: SecureStore,
    }),
    deviceAuthorizationClient(),
  ],
  fetchOptions: {
    // Sessions obtained by device pairing are stored as a raw session token
    // (there is no OAuth redirect to set a cookie). The server's `bearer`
    // plugin accepts it on every better-auth endpoint; cookie-based OAuth
    // sessions keep working unchanged because the header is only sent when a
    // paired token exists.
    auth: {
      type: "Bearer",
      token: () => getToken() ?? undefined,
    },
  },
});
