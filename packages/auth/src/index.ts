import { betterAuth } from "better-auth";

import { env } from "../env";
import { AuthInitOptions, sharedAuthConfig } from "./shared";

export function initAuth(options: AuthInitOptions) {
  return betterAuth(sharedAuthConfig(options));
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

// Default export better-auth config for CLI
export const auth = betterAuth(
  sharedAuthConfig({
    baseUrl: "http://localhost:3000",
    productionUrl: "https://myapp.com",
    secret: env.AUTH_SECRET,
    discordClientId: env.AUTH_DISCORD_ID,
    discordClientSecret: env.AUTH_DISCORD_SECRET,
  }),
);
