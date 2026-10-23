import type {
  Auth as BetterAuth,
  BetterAuthOptions,
  BetterAuthPlugin,
} from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { oAuthProxy } from "better-auth/plugins";
import { DatabaseSync } from "node:sqlite";

export async function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
  extraPlugins?: TExtraPlugins;
}): Promise<Auth> {
  const config: BetterAuthOptions = {
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
  };

  // better-auth validates the schema as soon as it initializes, so create the
  // tables first: a fresh database would otherwise log "Database schema
  // mismatch" before the auth routes are ready.
  const { runMigrations } = await getMigrations(config);
  await runMigrations();

  const auth = betterAuth(config);

  return auth;
}

export type Auth = BetterAuth<BetterAuthOptions>;
export type Session = Auth["$Infer"]["Session"];
