import { getEnv } from "@acme/env";

export const env = getEnv([
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
]);
