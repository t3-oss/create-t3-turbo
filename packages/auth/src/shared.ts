import type { BetterAuthOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

import { db } from "@acme/db/client";

export interface AuthInitOptions {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
}

export const sharedAuthConfig = (
  options: AuthInitOptions,
): BetterAuthOptions => ({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: options.baseUrl,
  secret: options.secret,
  plugins: [
    oAuthProxy({
      /**
       * Auto-inference blocked by https://github.com/better-auth/better-auth/pull/2891
       */
      currentURL: options.baseUrl,
      productionURL: options.productionUrl,
    }),
    expo(),
  ],
  socialProviders: {
    discord: {
      clientId: options.discordClientId,
      clientSecret: options.discordClientSecret,
      redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
    },
  },
  trustedOrigins: ["expo://"],
});
