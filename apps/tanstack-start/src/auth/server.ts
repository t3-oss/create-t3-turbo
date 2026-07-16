import { initAuth, parseSsoTrustedIssuers } from "@gmacko/auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "~/env";
import { getBaseUrl } from "~/lib/url";

export const auth = initAuth({
  baseUrl: env.PORTLESS_URL ?? getBaseUrl(),
  productionUrl: env.APP_URL ?? getBaseUrl(),
  secret: env.AUTH_SECRET,
  githubClientId: env.AUTH_GITHUB_ID,
  githubClientSecret: env.AUTH_GITHUB_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
  appleClientId: env.AUTH_APPLE_ID,
  appleClientSecret: env.AUTH_APPLE_SECRET,
  appleBundleIdentifier: env.AUTH_APPLE_BUNDLE_ID,
  githubUrl: env.AUTH_GITHUB_URL,
  githubApiUrl: env.AUTH_GITHUB_API_URL,
  googleUrl: env.AUTH_GOOGLE_URL,
  googleTokenUrl: env.AUTH_GOOGLE_TOKEN_URL,
  appleUrl: env.AUTH_APPLE_URL,
  bypassMagicLink: env.BYPASS_MAGIC_LINK,
  ssoTrustedIssuers: parseSsoTrustedIssuers(env.AUTH_SSO_TRUSTED_ISSUERS),

  extraPlugins: [tanstackStartCookies()],
});
