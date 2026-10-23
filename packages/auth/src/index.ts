import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { oAuthProxy } from "better-auth/plugins";
import { DatabaseSync } from "node:sqlite";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    // eslint-disable-next-line no-restricted-properties -- DATABASE_URL is shared with @acme/db, not part of authEnv()
    database: new DatabaseSync(process.env.DATABASE_URL ?? "./sqlite.db"),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      discord: {
        clientId: options.discordClientId,
        clientSecret: options.discordClientSecret,
        redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
      },
    },
    trustedOrigins: ["expo://", "http://localhost:3001"],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  const auth = betterAuth(config);

  // better-auth only creates its tables when asked; run the adapter's
  // migrations in the background on init so the schema exists before first use.
  void auth.$context
    .then((ctx) => ctx.runMigrations())
    .catch((error: unknown) => {
      console.error("BETTER AUTH MIGRATION ERROR", error);
    });

  return auth;
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
