import { ssoClient } from "@better-auth/sso/client";
import {
  deviceAuthorizationClient,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), deviceAuthorizationClient(), ssoClient()],
});
