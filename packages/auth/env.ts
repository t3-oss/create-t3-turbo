import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export function authEnv() {
  return createEnv({
    server: {
      AUTH_GITHUB_ID: z.string().min(1),
      AUTH_GITHUB_SECRET: z.string().min(1),
      AUTH_GOOGLE_ID: z.string().min(1),
      AUTH_GOOGLE_SECRET: z.string().min(1),
      AUTH_APPLE_ID: z.string().min(1).optional(),
      AUTH_APPLE_SECRET: z.string().min(1).optional(),
      AUTH_APPLE_BUNDLE_ID: z.string().min(1).optional(),
      AUTH_GITHUB_URL: z.string().url().optional(),
      AUTH_GITHUB_API_URL: z.string().url().optional(),
      AUTH_GOOGLE_URL: z.string().url().optional(),
      AUTH_GOOGLE_TOKEN_URL: z.string().url().optional(),
      AUTH_APPLE_URL: z.string().url().optional(),
      // Comma-separated origins of bring-your-own SSO identity providers
      // (e.g. "https://gmacko.okta.com,https://login.microsoftonline.com").
      // OIDC discovery refuses issuers outside the trusted-origins list, so
      // operators must allow-list their IdP here before registering it.
      AUTH_SSO_TRUSTED_ISSUERS: z.string().optional(),
      AUTH_SECRET:
        process.env.NODE_ENV === "production"
          ? z.string().min(1)
          : z.string().min(1).optional(),
      BYPASS_MAGIC_LINK: z.coerce.boolean().default(false),
      NODE_ENV: z.enum(["development", "production"]).optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      !!process.env.CI ||
      process.env.SKIP_ENV_VALIDATION === "1" ||
      process.env.npm_lifecycle_event === "lint",
  });
}
