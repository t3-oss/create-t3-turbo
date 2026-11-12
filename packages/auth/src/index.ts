import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { mockDiscord } from "@mockatoo/connect-better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy } from "better-auth/plugins";

import { db } from "@acme/db/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string | undefined;
  discordClientSecret: string | undefined;
  extraPlugins?: TExtraPlugins;
}) {
  const isProduction =
    new URL(options.baseUrl).origin === new URL(options.productionUrl).origin;
  const discordOptions = {
    clientId: options.discordClientId ?? "",
    clientSecret: options.discordClientSecret ?? "",
    redirectURI: `${isProduction ? options.productionUrl : options.baseUrl}/api/auth/callback/discord`,
  };
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      ...(isProduction
        ? [
            oAuthProxy({
              productionURL: options.productionUrl,
            }),
          ]
        : []),
      ...(isProduction ? [] : [mockDiscord(discordOptions)]),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: isProduction ? { discord: discordOptions } : {},
    trustedOrigins: ["expo://"],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
